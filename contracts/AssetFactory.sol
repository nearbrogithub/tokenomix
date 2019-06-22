pragma solidity ^0.5.0;

import './IAsset.sol';
import './BaseAsset.sol';

contract AssetFactory {

    struct Asset {
        address owner;                    // Asset's owner address.
        uint totalSupply;                 // Asset's total supply.
        string name;                      // Asset's name, for information purposes.
        string description;               // Asset's description, for information purposes.
        bool isTransferable;              // Wether can be transfered
        bool isReissuable;                // Indicates if asset have dynamic or fixed supply.
        uint8 baseUnit;                   // Proposed number of decimals.
    }

    // Asset symbol to asset mapping.
    mapping(bytes32 => Asset) public assets;
    mapping(address => bytes32[]) public assetsOwner;
    mapping(bytes32 => IAsset) public assetsAddresses;
    // mapping(address => uint256) private assetsNumber;

    // function getAssetsNumber(address _owner) public view returns(uint256) {
    //     return assetsNumber[_owner];
    // }

    function getAssetsNumber(address _owner) public view returns(uint256) {
        return assetsOwner[_owner].length;
    }

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

     /**
     * Issues new asset token on the platform.
     *
     * Tokens issued with this call go straight to contract owner.
     * Each symbol can be issued only once, and only by contract owner.
     *
     * @param _symbol asset symbol.
     * @param _value amount of tokens to issue immediately.
     * @param _name name of the asset.
     * @param _description description for the asset.
     * @param _baseUnit number of decimals.
     * @param _isTransferable whether it can be transferred to others
     * @param _isReissuable dynamic or fixed supply.
     *
     * @return success.
     */
    function issueAsset(bytes32 _symbol, uint _value, string memory _name,
    string memory _description, uint8 _baseUnit, bool _isTransferable,
    bool _isReissuable) public returns(address) {
        // Should have positive value if supply is going to be fixed.
        if (_value == 0 && !_isReissuable) {
            revert("Cannot issue 0 value fixed asset");
        }
        require(_baseUnit > 0 && _baseUnit <= 18, 'Invalid Decimals parameter');
        // Should not be issued yet.
        require(!isCreated(_symbol),"Asset already issued");

        //uint holderId = _createHolderId(msg.sender);

        assets[_symbol] = Asset(msg.sender, _value, _name, _description, _isReissuable, _isTransferable, _baseUnit);
        BaseAsset c = new BaseAsset(msg.sender, _name, _symbol, _value, _baseUnit, _isTransferable, _isReissuable);
        assetsOwner[msg.sender].push(_symbol);
        assetsAddresses[_symbol] = c;
        c.transferContractOwnership(msg.sender);
        return address(c);
    }
}