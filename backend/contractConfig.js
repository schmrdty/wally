export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
{
  "_format": "hh-sol-artifact-1",
  "contractName": "WallyWatcherV2",
  "sourceName": "contracts/WallyWatcherV2.sol",
  "abi": [
    { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
    { "inputs": [], "name": "AccessControlBadConfirmation", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "bytes32", "name": "neededRole", "type": "bytes32" }], "name": "AccessControlUnauthorizedAccount", "type": "error" },
    { "inputs": [], "name": "InvalidInitialization", "type": "error" },
    { "inputs": [], "name": "NotInitializing", "type": "error" },
    { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "SafeERC20FailedOperation", "type": "error" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newBackend", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "changeEffectiveAt", "type": "uint256" }], "name": "BackendRoleChangeProposed", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "oldBackend", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newBackend", "type": "address" }], "name": "BackendRoleChanged", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint64", "name": "version", "type": "uint64" }], "name": "Initialized", "type": "event" },
    { "inputs": [], "name": "BACKEND_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "DEFAULT_ADMIN_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "ROLE_CHANGE_DELAY", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "executeBackendRoleChange", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getPermission
];