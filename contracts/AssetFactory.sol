pragma solidity ^0.5.0;

import './Owned.sol';
import './IAsset.sol';

contract AssetFactory is Owned {

    struct Asset {
        address owner;                    // Asset's owner address.
        uint totalSupply;                 // Asset's total supply.
        string name;                      // Asset's name, for information purposes.
        string description;               // Asset's description, for information purposes.
        bool isReissuable;                // Indicates if asset have dynamic or fixed supply.
        bool isTransferable;              // Wether can be transfered
        uint8 baseUnit;                   // Proposed number of decimals.
    }

    // Asset symbol to asset mapping.
    mapping(bytes32 => Asset) public assets;
    mapping(address => bytes32[]) public assetsOwner;
    mapping(bytes32 => IAsset) public assetsAddresses;

     /**
     * Emits Error if called not by asset owner.
     */
    modifier onlyOwner(bytes32 _symbol) {
        require (isOwner(msg.sender, _symbol), 'Only owner: access denied');
        _;
    }

    /**
     * Check asset existance.
     *
     * @param _symbol asset symbol.
     *
     * @return asset existance.
     */
    function isCreated(bytes32 _symbol) public view returns(bool) {
        return assets[_symbol].owner != address(0);
    }

    /**
     * Returns asset decimals.
     *
     * @param _symbol asset symbol.
     *
     * @return asset decimals.
     */
    function baseUnit(bytes32 _symbol) public view returns(uint8) {
        return assets[_symbol].baseUnit;
    }

    /**
     * Returns asset name.
     *
     * @param _symbol asset symbol.
     *
     * @return asset name.
     */
    function name(bytes32 _symbol) public view returns(string memory) {
        return assets[_symbol].name;
    }

    /**
     * Returns asset description.
     *
     * @param _symbol asset symbol.
     *
     * @return asset description.
     */
    function description(bytes32 _symbol) public view returns(string memory) {
        return assets[_symbol].description;
    }

    /**
     * Returns asset reissuability.
     *
     * @param _symbol asset symbol.
     *
     * @return asset reissuability.
     */
    function isReissuable(bytes32 _symbol) public view returns(bool) {
        return assets[_symbol].isReissuable;
    }

    /**
     * Returns asset owner address.
     *
     * @param _symbol asset symbol.
     *
     * @return asset owner address.
     */
    function owner(bytes32 _symbol) public view returns(address) {
        return assets[_symbol].owner;
    }

    /**
     * Check if specified address has asset owner rights.
     *
     * @param _owner address to check.
     * @param _symbol asset symbol.
     *
     * @return owner rights availability.
     */
    function isOwner(address _owner, bytes32 _symbol) public view returns(bool) {
        return isCreated(_symbol) && (assets[_symbol].owner == _owner);
    }

    /**
     * Returns asset total supply.
     *
     * @param _symbol asset symbol.
     *
     * @return asset total supply.
     */
    function totalSupply(bytes32 _symbol) public view returns(uint) {
        return assets[_symbol].totalSupply;
    }

    /**
     * Returns asset balance for a particular holder.
     *
     * @param _holder holder address.
     * @param _symbol asset symbol.
     *
     * @return holder balance.
     */
    function balanceOf(address _holder, bytes32 _symbol) public view returns(uint) {
        return assetsAddresses[_symbol].balanceOf(_holder);
    }

    
}