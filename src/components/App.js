import React, { Component } from 'react';
import Web3 from 'web3'
import logo from '../logo.png';
import './App.css';
import Marketplace from '../abis/Marketplace.json'

import Navbar from './Navbar.js'
import Main from './Main.js'

class App extends Component {

  constructor(props) {
    super(props) 
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true,
      marketplace: {}
    }

    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }
  
  async componentWillMount() {
    await this.loadWeb3();
    console.log('window.web3', window.web3)
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    // detecting metamask
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('non ethereum browser detected')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] })
    
    const networkId = await web3.eth.net.getId();

    const networkData = Marketplace.networks[networkId]

    if (networkData) {
      const marketplace = web3.eth.Contract(Marketplace.abi, networkData.address)
      const productCount = await marketplace.methods.productCount().call()
      let product=[];
      // Load products
      for(var i=0; i<=productCount; i++) {
        product.push(await marketplace.methods.products(i).call())
      }

      this.setState({ 
        marketplace: marketplace,
        productCount: productCount,
        products: product,
        loading: false
      })
    } else {
      window.alert('Marketplace contract not deployed to detected network')
    }
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? 
                <div id="loader" className="text-center">
                  <p className="text-center">
                    Loading...
                  </p>
                </div>
              :
                <Main 
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct}
                  products={this.state.products}
                />
              }
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
