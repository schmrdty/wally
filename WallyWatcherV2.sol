// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";

contract WallyWatcherV2 is Initializable, ReentrancyGuardUpgradeable, AccessControlEnumerableUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");
    address public gnosisSafe;

    struct Permission {
        address withdrawalAddress;
        uint256 expiresAt; // UNIX timestamp
        bool isActive;
        uint256 remainingBalance; // Remaining balance to leave in wallet (1, 0, 0.1, or 0.001 tokens)
        bool allowEntireWallet; // Whether the user allows transfers of all tokens
        address[] validTokenContracts; // List of valid token contract addresses for permission
    }

    struct RoleChangeRequest {
        address newBackend;
        uint256 changeEffectiveAt; // Timestamp when the change becomes effective
    }

    mapping(address => Permission) private permissions;

    RoleChangeRequest public pendingBackendChange;
    uint256 public constant ROLE_CHANGE_DELAY = 72 hours;

    event PermissionGranted(
        address indexed user,
        address indexed withdrawalAddress,
        uint256 expiresAt,
        uint256 remainingBalance,
        bool allowEntireWallet,
        address[] validTokenContracts
    );
    event PermissionRevoked(address indexed user);
    event TokenTransferred(address indexed user, address indexed token, uint256 amount);
    event BackendRoleChangeProposed(address indexed newBackend, uint256 changeEffectiveAt);
    event BackendRoleChanged(address indexed oldBackend, address indexed newBackend);
    event WalletActivityLogged(address indexed user, string activity, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // Prevent direct initialization of the implementation contract
    }

    /// @notice Initialize the contract (replaces constructor for upgradeable contracts)
    /// @param _adminSafe The Gnosis Safe address that will be assigned admin roles
    function initialize(address _adminSafe) public initializer {
        // Initialize parent contracts
        __AccessControlEnumerable_init();
        __ReentrancyGuard_init();

        // Assign the Gnosis Safe address
        gnosisSafe = _adminSafe;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _adminSafe);
        _grantRole(BACKEND_ROLE, _adminSafe);
    }

    function grantPermission(
        address withdrawalAddress,
        uint256 durationInSeconds,
        uint256 remainingBalance,
        bool allowEntireWallet,
        address[] calldata validTokenContracts
    ) external nonReentrant {
        require(withdrawalAddress != address(0), "Wally: invalid address");
        require(durationInSeconds > 0, "Wally: invalid duration");
        require(
            remainingBalance == 1 || remainingBalance == 0 || remainingBalance == 0.1 ether || remainingBalance == 0.001 ether,
            "Wally: invalid remaining balance"
        );
        require(validTokenContracts.length > 0 || allowEntireWallet, "Wally: must allow at least one token or entire wallet");

        permissions[msg.sender] = Permission({
            withdrawalAddress: withdrawalAddress,
            expiresAt: block.timestamp + durationInSeconds,
            isActive: true,
            remainingBalance: remainingBalance,
            allowEntireWallet: allowEntireWallet,
            validTokenContracts: validTokenContracts
        });

        emit PermissionGranted(
            msg.sender,
            withdrawalAddress,
            block.timestamp + durationInSeconds,
            remainingBalance,
            allowEntireWallet,
            validTokenContracts
        );
    }

    function revokePermission() external nonReentrant {
        require(permissions[msg.sender].isActive, "Wally: already inactive");

        permissions[msg.sender].isActive = false;
        permissions[msg.sender].withdrawalAddress = address(0);
        permissions[msg.sender].expiresAt = 0;

        emit PermissionRevoked(msg.sender);
    }

    function transferToken(
        address user,
        address token,
        uint256 amount
    ) external onlyRole(BACKEND_ROLE) nonReentrant {
        Permission memory perm = permissions[user];
        require(perm.isActive, "Wally: inactive permission");
        require(block.timestamp <= perm.expiresAt, "Wally: permission expired");
        require(perm.withdrawalAddress != address(0), "Wally: no withdrawal address");
        require(token != address(0), "Wally: invalid token");

        bool isValidToken = perm.allowEntireWallet;
        for (uint256 i = 0; i < perm.validTokenContracts.length; i++) {
            if (perm.validTokenContracts[i] == token) {
                isValidToken = true;
                break;
            }
        }
        require(isValidToken, "Wally: token not allowed");

        uint256 balance = IERC20(token).balanceOf(user);
        require(balance >= amount + perm.remainingBalance, "Wally: insufficient balance after transfer");

        IERC20(token).safeTransferFrom(user, perm.withdrawalAddress, amount);

        emit TokenTransferred(  user, token, amount);
        emit WalletActivityLogged(user, "Token transferred", block.timestamp);
    }

    function proposeBackendRoleChange(address newBackend) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBackend != address(0), "Wally: invalid backend address");
        pendingBackendChange = RoleChangeRequest({
            newBackend: newBackend,
            changeEffectiveAt: block.timestamp + ROLE_CHANGE_DELAY
        });

        emit BackendRoleChangeProposed(newBackend, block.timestamp + ROLE_CHANGE_DELAY);
    }

    function executeBackendRoleChange() external {
        require(
            pendingBackendChange.changeEffectiveAt > 0 && block.timestamp >= pendingBackendChange.changeEffectiveAt,
            "Wally: change not yet effective"
        );
        address oldBackend = getRoleMember(BACKEND_ROLE, 0);
        _revokeRole(BACKEND_ROLE, oldBackend);
        _grantRole(BACKEND_ROLE, pendingBackendChange.newBackend);

        emit BackendRoleChanged(oldBackend, pendingBackendChange.newBackend);

        delete pendingBackendChange; // Clear pending change
    }

    function getPermission(address user) external view returns (Permission memory) {
        return permissions[user];
    }
}