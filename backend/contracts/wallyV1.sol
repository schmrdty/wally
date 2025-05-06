// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

interface IERC20Decimals {
    function decimals() external view returns (uint8);
}

contract WallyV1 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Whitelist token controls
    address public whitelistToken;
    uint256 public minWhitelistBalance;

    // User-defined thresholds
    mapping(address => uint256) public minNativeThreshold;
    mapping(address => mapping(address => uint256)) public minTokenThreshold;

    // EVENTS
    event MinThresholdSet(address indexed user, address indexed token, uint256 min);
    event TransferPerformed(address indexed from, address indexed to, address indexed token, uint256 amount, bool gasless);
    event Revoke(address indexed user, address indexed target);
    event BatchExecuted(address indexed user, uint256 numCalls);
    event WhitelistTokenChanged(address indexed newToken, uint256 minBalance);

    modifier onlyWhitelisted(address user) {
        require(
            IERC20Upgradeable(whitelistToken).balanceOf(user) >= minWhitelistBalance,
            "Not whitelisted"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _whitelistToken, uint256 _minWhitelistBalance) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        whitelistToken = _whitelistToken;
        minWhitelistBalance = _minWhitelistBalance;
    }

    // --- Owner/Admin ---
    function setWhitelistToken(address newToken, uint256 newMin) external onlyOwner {
        whitelistToken = newToken;
        minWhitelistBalance = newMin;
        emit WhitelistTokenChanged(newToken, newMin);
    }

    // --- User Thresholds ---
    function setMinNativeThreshold(uint256 min) external {
        minNativeThreshold[msg.sender] = min;
        emit MinThresholdSet(msg.sender, address(0), min);
    }
    function setMinTokenThreshold(address token, uint256 min) external {
        minTokenThreshold[msg.sender][token] = min;
        emit MinThresholdSet(msg.sender, token, min);
    }

    // --- Transfers (EOA or Smart Wallet, supports batching) ---
    function performTransfer(address token, address to, uint256 amount, bool gasless)
        external
        nonReentrant
        onlyWhitelisted(msg.sender)
    {
        if (token == address(0)) {
            // Native
            uint256 min = minNativeThreshold[msg.sender];
            require(address(msg.sender).balance - min >= amount, "Native below threshold");
            (bool success, ) = to.call{value: amount}("");
            require(success, "Native transfer failed");
            emit TransferPerformed(msg.sender, to, token, amount, gasless);
        } else {
            // ERC20
            uint256 min = minTokenThreshold[msg.sender][token];
            uint256 bal = IERC20Upgradeable(token).balanceOf(msg.sender);
            require(bal - min >= amount, "Token below threshold");
            IERC20Upgradeable(token).safeTransferFrom(msg.sender, to, amount);
            emit TransferPerformed(msg.sender, to, token, amount, gasless);
        }
    }

    // --- Batch/Multicall ---
    function batch(bytes[] calldata calls)
        external
        nonReentrant
        onlyWhitelisted(msg.sender)
    {
        for (uint i = 0; i < calls.length; i++) {
            (bool success, ) = address(this).delegatecall(calls[i]);
            require(success, "Batch call failed");
        }
        emit BatchExecuted(msg.sender, calls.length);
    }

    // --- Example: Revoke ---
    function revoke(address target) external onlyWhitelisted(msg.sender) {
        emit Revoke(msg.sender, target);
    }

    // --- UUPS Upgrade Authorization ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Receive ---
    receive() external payable {}
}