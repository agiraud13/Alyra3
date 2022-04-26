import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, Card, DropdownButton, Dropdown} from "react-bootstrap";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    owner: null,
  };

  //Base
  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      web3.eth.handleRevert = true;
      
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      
      const deployedNetwork = Voting.networks[networkId];
      const instance = new web3.eth.Contract(
        Voting.abi,
        deployedNetwork && deployedNetwork.address
      );
      
      this.setState({ web3, accounts, contract: instance }, this.runRestart);
      const contractOwner = await this.affectOwner();
      this.setState({ owner: contractOwner });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  runRestart = async () => {
    window.ethereum.on("accountsChanged", function (accounts) {
      window.location.href = "http://localhost:3000";
    });
  };

  //Interagir avec le smart contract
  addVoter = async () => {
    const { accounts, contract } = this.state;
    const address = this.address.value;
    try {
      await contract.methods.addVoter(address).send({ from: accounts[0] });
    } catch (e) {
      console.log("Erreur");
    }
  };

  startProposalsRegistering = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods
        .startProposalsRegistering()
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  addProposal = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods
        .addProposal(document.getElementById("_desc").value)
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  endProposalsRegistering = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods
        .endProposalsRegistering()
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  startVotingSession = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods
        .startVotingSession()
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  setVote = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods
        .setVote(document.getElementById("_id").value)
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  endVotingSession = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.endVotingSession().send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  tallyVotes = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.tallyVotes().send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  getWinner = async () => {
    const { accounts, contract } = this.state;
    try {
      const text = document.createTextNode(
        "Proposition Gagnante : " +
          (await contract.methods.getWinner().call({ from: accounts[0] }))
      );
      const newP = document.createElement("p");
      newP.appendChild(text);
      document.getElementById("winnerInfo").appendChild(newP);
    } catch (e) {
      console.log(e, "Erreur");
    }
  };

  //Owner
  getOwner = function () {
    const { contract } = this.state;
    return new Promise(function (resolve) {
      resolve(contract.methods.owner().call());
    });
  };

  affectOwner = async () => {
    var result = await this.getOwner();
    return result;
  };


  render() {
    if (!this.state.web3) {
      return <h1>Wallet not found</h1>;
    }

    if (
      String(this.state.owner).toLowerCase() ===
      String(this.state.accounts[0]).toLowerCase()
    ) {
      return (
        <div>
          <h1>Voting page</h1>
            <p id="userAddress"> Account : {this.state.accounts[0]}
          </p>
          
        <Card>
          <Card.Header>
            Workflows
          </Card.Header>
          <Card.Body>
            <DropdownButton id="dropdown-item-button" title="status">
              <Dropdown.Item as="button">
                <Button onClick={this.startProposalsRegistering}>
                  ProposalsRegistrationStarted
                </Button>
              </Dropdown.Item>
              <Dropdown.Item as="button">
               <Button onClick={this.endProposalsRegistering}>
                  ProposalsRegistrationEnded
                </Button>
              </Dropdown.Item>
              <Dropdown.Item as="button">
                <Button onClick={this.startVotingSession}>
                  startVotingSession
                </Button>
              </Dropdown.Item>
              <Dropdown.Item as="button">
                <Button onClick={this.endVotingSession}>
                  endVotingSession
                </Button>
              </Dropdown.Item>
              <Dropdown.Item as="button">
                <Button onClick={this.tallyVotes}>
                  tallyVotes
                </Button>
              </Dropdown.Item>
            </DropdownButton>
          </Card.Body>
        </Card>

        <br></br>

        <Card>
          <Card.Header>
            Add a voter to the Alyra voting system 
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="formAddress">
              <Form.Label>
                Voter adress :
              </Form.Label>
                <Form.Control
                  type="text"
                  id="address"
                  ref={(input) => {this.address = input;}}
                />
              </Form.Group>
              <Button onClick={this.addVoter}>
                Add
              </Button>
            </Card.Body>
           </Card>
        
        <br></br>

        <Card>
          <Card.Header>
            Add a proposal
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="formDescription">
              <Form.Label>
                Proposal description :
              </Form.Label>
              <Form.Control 
                type="text"
                id="_desc"
              />
            </Form.Group>
            <Button onClick={this.addProposal}>
              Add
            </Button>
          </Card.Body>
        </Card>
          
        <br></br>

        <Card>
          <Card.Header>
            Vote
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="formId">
              <Form.Label>
                Proposal ID :
              </Form.Label>
              <Form.Control
                type="text"
                id="_id"
              />
            </Form.Group>
            <Button onClick={this.setVote}>
              Add
            </Button>
          </Card.Body>
        </Card>
        
        <br></br>

        <Card>
          <Card.Header>
            Result
          </Card.Header>
          <Card.Body id="winnerInfo">
            <Button onClick={this.getWinner}>
              Get Winner
            </Button>
          </Card.Body>
        </Card>

        <br></br>
      
        </div>
      );
    }
   
    if (
      String(this.state.owner).toLowerCase() !==
      String(this.state.accounts[0]).toLowerCase()
    ) {
      return (
        <div>
            <h1>Voting page</h1>
            <p id="userAddress">Account : {this.state.accounts[0]}</p>
          
            <Card>
          <Card.Header>
            Add a proposal
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="formDescription">
              <Form.Label>
                Proposal description:
              </Form.Label>
              <Form.Control 
                type="text"
                id="_desc"
              />
            </Form.Group>
            <Button onClick={this.addProposal}>
              Add
            </Button>
          </Card.Body>
        </Card>
          
        <br></br>

        <Card>
          <Card.Header>
            Vote
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="formId">
              <Form.Label>
                Proposal ID :
              </Form.Label>
              <Form.Control
                type="text"
                id="_id"
              />
            </Form.Group>
            <Button onClick={this.setVote}>
              Add
            </Button>
          </Card.Body>
        </Card>
        
        <br></br>

        <Card>
          <Card.Header>
            Result
          </Card.Header>
          <Card.Body id="winnerInfo">
            <Button onClick={this.getWinner}>
              Get Winner
            </Button>
          </Card.Body>
        </Card>
    
     </div>
      );
    }
  }
}

export default App;