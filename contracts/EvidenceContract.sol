// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;


contract EvidenceContract {

    struct Evidence {
        uint id;
        string caseId;
        string evidenceName;
        string fileHash;
        address uploadedBy;
        uint timestamp;
    }

    uint public evidenceCount = 0;

    mapping(uint => Evidence) public evidences;

    event EvidenceUploaded(
        uint id,
        string caseId,
        string evidenceName,
        string fileHash,
        address uploadedBy,
        uint timestamp
    );

    function uploadEvidence(
        string memory _caseId,
        string memory _evidenceName,
        string memory _fileHash
    ) public {

        evidenceCount++;

        evidences[evidenceCount] = Evidence(
            evidenceCount,
            _caseId,
            _evidenceName,
            _fileHash,
            msg.sender,
            block.timestamp
        );

        emit EvidenceUploaded(
            evidenceCount,
            _caseId,
            _evidenceName,
            _fileHash,
            msg.sender,
            block.timestamp
        );
    }

    function getEvidence(uint _id) public view returns(
        uint,
        string memory,
        string memory,
        string memory,
        address,
        uint
    ){
        Evidence memory e = evidences[_id];
        return(
            e.id,
            e.caseId,
            e.evidenceName,
            e.fileHash,
            e.uploadedBy,
            e.timestamp
        );
    }
}
