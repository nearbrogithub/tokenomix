const SafeMath = artifacts.require("SafeMath");
const AssetFactory = artifacts.require("AssetFactory");

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, AssetFactory);
  deployer.deploy(AssetFactory);
};