// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Vote system
 * @notice Smart voting contract for a small organization
 * @author Arnaud Giraud
 */

contract Voting is Ownable {

    ///@dev Voter information
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    ///@dev Proposal information
    struct Proposal {
        string description;
        uint voteCount;
    }

    ///@dev State of vote system
    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    ///@dev state status
    WorkflowStatus public workflowStatus;

    ///@dev Array of proposals
    Proposal[] proposalsArray;
    
    ///@dev Mapping of voters
    mapping (address => Voter) voters;
    
    ///@dev ID of the winning proposal
    uint public winningProposalID;

    ///@dev Event when voter is registered
    ///@param voterAddress The voter address registered
    event VoterRegistered(address voterAddress);

    ///@dev Event when the worflow status change
    ///@param previousStatus The previous status
    ///@param newStatus The new status
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    
    ///@dev Event when a proposal is registered
    ///@param proposalId proposal id
    event ProposalRegistered(uint proposalId);

    ///@dev Event when a voter vote for a proposal
    ///@param voter Voter's address
    ///@param proposalId Proposal Id
    event Voted (address voter, uint proposalId);

    ///@dev Check if only registered voters can access
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    ///@notice Get voter information
    ///@dev Whitelisted voter can view voter information
    ///@param _addr voter address
    ///@return voters details
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    ///@notice Get a proposal
    ///@dev Whitelisted voter can view a proposal
    ///@param _id Proposal Id
    ///@return A proposal
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    ///@notice Get the winning proposal
    ///@dev Everyone can view the winning proposal
    ///@return The winning proposal
    function getWinner() external view returns (Proposal memory) {
        require(workflowStatus == WorkflowStatus.VotesTallied, 'Votes are not tallied yet');
        return proposalsArray[winningProposalID];
    }


    // ::::::::::::: REGISTRATION ::::::::::::: //

    ///@notice Owner add a new voter
    ///@dev Owner add a new voter, the status must be RegisteringVoters
    ///@param _addr Voter address
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    // ::::::::::::: PROPOSAL ::::::::::::: //

    ///@notice Voter can add a proposal
    ///@dev Voter can add a proposal, the status must be ProposalsRegistrationStarted
    ///@param _desc Description of the proposal
    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer');
        require(proposalsArray.length < 100, 'On ne peut pas accepter plus de 100 propositions');
        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    ///@notice Voters vote for a proposal
    ///@dev Voters vote for a proposal, the status must be VotingSessionStarted
    ///@param _id Proposal id
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');
        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;
        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //

    ///@notice Owner start the proposal registration status
    ///@dev Owner start the proposal registration status, the status must be RegisteringVoters
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    ///@notice Owner end the proposal registration status
    ///@dev Owner end the proposal registration status, the status must be ProposalsRegistrationStarted
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    ///@notice Owner start the voting session
    ///@dev Owner start the voting session, the status must be ProposalsRegistrationEnded
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    ///@notice Owner end the voting session
    ///@dev Owner end the voting session, the status must be VotingSessionStarted
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    ///@notice Owner tallies the votes
    ///@dev Owner tallies the votes, the status must be VotingSessionEnded
   function tallyVotes() external onlyOwner {
       require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
       uint _winningProposalId;
      for (uint256 p = 0; p < proposalsArray.length; p++) {
           if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
               _winningProposalId = p;
          }
       }
       winningProposalID = _winningProposalId;

       workflowStatus = WorkflowStatus.VotesTallied;
       emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}