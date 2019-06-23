var account;
var expectedNetwork = {id:4, name: "Rinkeby"};//rinkeby

const GAS_PRICE = {
    SLOW: {
        ID: 'slow',
        PRICE: 5000000000,
        DESCRIPTION: 'Safe and Cheap'
    },
    NORMAL: {
        ID: 'normal',
        PRICE: 10000000000,
        DESCRIPTION: 'Normal'
    },
    FAST: {
        ID: 'fast',
        PRICE: 15000000000,
        DESCRIPTION: 'Fast and Expensive'
    },
    INSTANT: {
        ID: 'instant',
        PRICE: 45000000000,
        DESCRIPTION: 'Instantaneous and Expensive'
    },
    CUSTOM: {
        ID: 'custom',
        PRICE: 0,
        DESCRIPTION: 'Custom'
    },
    API: {
        URL: 'https://gasprice.poa.network'
    }
}

var curGasPrices;

App = {
    modes: {READONLY: 'readonly', 'FULL': 'full', ERROR:'error'},
    web3Provider: null,
    mainContract: null,
    mainContractAddress: null,
    mode: 'readonly',
    init: function() {
        App.initWeb3();
    
        App.initContract('AssetFactory');

        $.getJSON(GAS_PRICE.API.URL, function (data) {
            if (data.health === true) {
                curGasPrices = {};
                curGasPrices.slow = data.slow;
                curGasPrices.normal = data.standard;
                curGasPrices.fast = data.fast;
                curGasPrices.instant = data.instant;
            }
        })
    },

    getGastPrice: function (speed) {
        let price = GAS_PRICE.NORMAL.PRICE;
        switch (speed) {
            case GAS_PRICE.SLOW.ID:
                price = curGasPrices? web3.toWei(curGasPrices.slow, 'GWei') : GAS_PRICE.SLOW.PRICE;
                break;
            case GAS_PRICE.NORMAL.ID:
                price = curGasPrices? web3.toWei(curGasPrices.slow, 'GWei') : GAS_PRICE.SLOW.PRICE;
                break;
            case GAS_PRICE.FAST.ID:
                price = curGasPrices? web3.toWei(curGasPrices.slow, 'GWei') : GAS_PRICE.SLOW.PRICE;
                break;
            case GAS_PRICE.INSTANT:
                price = curGasPrices? web3.toWei(curGasPrices.slow, 'GWei') : GAS_PRICE.SLOW.PRICE;
                break;
        }
        return price;
    },

    getContract: function (address) {
        var contractName = App.contractsMap[address];
        return App.contracts[contractName];
    },
    
    initWeb3: function() {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            App.mode = App.modes.FULL;
        } else {
            // If no injected web3 instance is detected, fall back to Infura for readonly access
            App.web3Provider = new Web3.providers.HttpProvider('https://rinkeby.infura.io');
            App.showModal('You should download MetaMask/Mist for security reasons');
        }
        web3 = new Web3(App.web3Provider);

        web3.version.getNetwork((err, netId) => {
            if (err != null) {
                App.showModal("There was an error detecting current network.");
                return;
            }
            if (netId != expectedNetwork.id) {
                var errorText = 'You are connected to ';
                switch (netId) {
                    case "1":
                        errorText += 'Mainnet';
                        break;
                    case "2":
                        errorText += 'Morden test network';
                        break;
                    case "3":
                        errorText += 'Ropsten test network';
                        break;
                    case "4":
                        errorText += 'Rinkeby test network';
                        break;
                    case "42":
                        errorText += 'Kovan test network';
                        break;
                    default:
                        errorText += 'Unknown network: ' + netId;
                        break;
                }
                return;
                errorText += '. Please switch to ' + expectedNetwork.name;
                App.showModal(errorText);
                $('body').removeClass('loading');
            }

        })

        web3.eth.getAccounts(function (err, accs) {
            if (App.mode == App.modes.READONLY) {
                return;
            }
            if (err != null) {
                App.showModal("There was an error fetching your accounts.");
                return;
            }

            if (accs.length == 0) {
                App.showModal("Couldn't get any accounts! " +
                    "Make sure you are logged into MetaMask and Network settings are configured correctly.");
                return;
            }

            account = accs[0];
        });

    },


    initContract: function(name) {
        $.getJSON('/js/contracts/' + name + '.json?v=' + Date.now(), function(ContractArtifact) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            App.mainContract = TruffleContract(ContractArtifact);

            // Set the provider for our contract
            App.mainContract.setProvider(App.web3Provider);
            // App.mainContractAddress = address;

            App.updateUI();

        });
        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '#btn-create', App.handleIssueToken);
    },


    updateUI: function () {
        var contract = App.mainContract;
        contract.deployed().then(function(instance) {
            var promises = [];
            //console.log(instance);
            var AssetFactory = instance.contract;
            console.log('account', account);
            $('#myAssets').html('');
            AssetFactory.getAssetsNumber.call(account, function(err, res){
                if (!err) {
                    var numberOfAssets = res.toString(10);
                   $('#numberOfAssets').text(numberOfAssets);
                   if (numberOfAssets) {
                       for(var i=0; i < numberOfAssets; i++) {
                        AssetFactory.assetsOwner.call(account, i, function(err, res){
                            if (!err) {
                            var symbol = res;
                            AssetFactory.assetData.call(res, function(err, res) {
                                if (!err) {
                                    var assets = $('#myAssets');
                                    var textSymbol = web3.toUtf8(symbol);
                                    var assetTemplate = $('#assetTemplate');
                                    assetTemplate.find('.asset-symbol').text(textSymbol);
                                    assetTemplate.find('.asset-name').text(res[0]);
                                    assetTemplate.find('.asset-description').text(res[1]);
                                    assetTemplate.find('.asset-supply').text(res[2].toString(10));
                                    assetTemplate.find('.asset-decimals').text(res[3].toString(10));
                                    assetTemplate.find('.asset-transferable').text(res[4]? 'Yes' : 'No');
                                    assetTemplate.find('.asset-mintable').text(res[5]? 'Yes' : 'No');

                                    var row = assetTemplate.html();
                                    assets.append(row);
                                }
                                console.log(res);
                                
        
                            })
                            } else {
                                console.log('cannot get symbol at position ' + i);
                            }
                        }); 
                            
                       }
                    
            
                   }
                } else {
                    console.log('getting assets number error', err);
                }
            });
            $('body').removeClass('loading');
        });

    },

    showTransactions: function () {
        var transactions = $('#transactions');
        transactions.html('');
        var transactionTemplate = $('#transactionTemplate');
        $.getJSON("https://rinkeby.etherscan.io/api?module=account&action=txlist&address=" + App.mainContractAddress + "&startblock=0&endblock=99999999&sort=asc", function (data) {
                data.result.forEach(function (e) {
                    if (e.value == 0) {
                        return;
                    }
                    transactionTemplate.find('.tx-hash').text(e.hash);
                    transactionTemplate.find('.tx-value').text(web3.fromWei(e.value, 'ether') + ' ETH');
                    transactionTemplate.find('.tx-date').text(new Date(e.timeStamp * 1000).toGMTString());
                    transactionTemplate.find('.tx-direction').text(e.from === App.mainContractAddress? 'Outbound' : 'Inbound');
                    var row = transactionTemplate.html();
                    transactions.append(row);
                });
        });
    },

    formatToken: function(number) {
        var returnValue = web3.toBigNumber(number).dividedBy(App.tokenDecimals);
        return (typeof returnValue == 'object') ? returnValue : returnValue.toString(10);
    },

    handleIssueToken: function(event) {

        event.preventDefault();
        var symbol = web3.toHex($('#asset_symbol').val());
        var amount = $('#asset_supply').val();
        var name = $('#asset_name').val();
        var description = $('#asset_description').val();
        var decimals = $('#asset_decimals').val();
        var isTransferable = $('#asset_transferable').is(":checked");
        var isMintable = $('#asset_mintable').is(":checked");
     
        App.mainContract.deployed().then(function(instance) {
            return $('body').addClass('loading') && instance.issueAsset(
                symbol, amount, name, description, decimals, isTransferable, isMintable
            );
            
            
            // return $('body').addClass('loading')
            //     && instance.contribute({from: account, value: amount, gas: 200000, gasPrice:App.getGastPrice(speed)});//40Gwei
        }).then(function(result) {
            App.updateUI();
        }).catch(function(err) {
            console.log(err.message);
            $('body').removeClass('loading');
        });
    },

    showModal: function (message) {
        $('#myModal h3').html( message );
        $('#myModal').modal();
    }
};

$(function() {
    $(window).load(function() {
        $('body').addClass('loading');
        App.init();
    });

    validateAmount = function () {
        $('#amount_error').hide();
        const contributeButton = $('.btn-contribute');
        contributeButton.removeAttr('disabled');
        if (this.value <= 0) {
            contributeButton.attr('disabled', 'disabled');
        } else {
            let minContribution = parseInt($('#minContribution').text());
            let maxContribution = parseInt($('#maxContribution').text());

            let minWei = web3.toBigNumber((web3.toWei(minContribution, 'ether')));
            let maxWei = web3.toBigNumber(web3.toWei(maxContribution, 'ether'));

            let amount = parseInt($('#amount').val());
            let unit = $('#unit').val();
            if (unit != 'wei') {
                amount = web3.toWei(amount, unit);
            }
            amount = web3.toBigNumber(amount);

            if (amount.lt(minWei)) {
                showAmountError('Amount should be >= MIN Contribution');
            }
            if (amount.gt(maxWei)) {
                showAmountError('Amount should be <= MAX Contribution');
            }

        }
    }

    showAmountError = function (error) {
        $('#amount_error').text(error);
        $('.btn-contribute').attr('disabled', 'disabled');
        $('#amount_error').show();
    }

    $("#amount").keyup(function () {

        if (this.value != this.value.replace(/[^0-9\.]/g, '')) {
            this.value = this.value.replace(/[^0-9\.]/g, '');
        }
        validateAmount();
    });
    $("#unit").change(function () {
        validateAmount();
    })
});
