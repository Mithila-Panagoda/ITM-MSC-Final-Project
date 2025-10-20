"""
Blockchain service for interacting with the deployed smart contract.
Handles all on-chain operations for charities, campaigns, and donations.
"""

import os
import json
import logging
from decimal import Decimal
from typing import Tuple, Optional, Dict, Any
from datetime import datetime

from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


class BlockchainServiceError(Exception):
    """Custom exception for blockchain service errors"""
    pass


class BlockchainService:
    """Service class for blockchain interactions"""
    
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.admin_account = None
        self.is_configured = False
        self._initialize_web3()
    
    def _initialize_web3(self):
        """Initialize Web3 connection and contract instance"""
        try:
            # Get configuration from settings
            rpc_url = getattr(settings, 'BLOCKCHAIN_RPC_URL', '')
            contract_address = getattr(settings, 'CONTRACT_ADDRESS', '')
            admin_private_key = getattr(settings, 'ADMIN_WALLET_PRIVATE_KEY', '')
            
            if not all([rpc_url, contract_address, admin_private_key]):
                logger.warning(
                    "Blockchain configuration missing. Blockchain features will be disabled. "
                    "Please set BLOCKCHAIN_RPC_URL, CONTRACT_ADDRESS, and ADMIN_WALLET_PRIVATE_KEY "
                    "in your environment to enable blockchain features."
                )
                self.is_configured = False
                return
            
            # Initialize Web3
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            
            if not self.w3.is_connected():
                raise BlockchainServiceError("Failed to connect to blockchain network")
            
            # Load contract ABI
            abi_path = os.path.join(settings.BASE_DIR, '..', 'contracts', 'contract_minimal_abi.json')
            with open(abi_path, 'r') as f:
                contract_abi = json.load(f)
            
            # Create contract instance
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=contract_abi
            )
            
            # Initialize admin account
            self.admin_account = self.w3.eth.account.from_key(admin_private_key)
            
            logger.info(f"Blockchain service initialized. Connected to {rpc_url}")
            logger.info(f"Contract address: {contract_address}")
            logger.info(f"Admin address: {self.admin_account.address}")
            self.is_configured = True
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain service: {str(e)}")
            self.is_configured = False
            # Don't raise exception, just log warning
            logger.warning("Blockchain service initialization failed. Blockchain features will be disabled.")
    
    def _check_configured(self):
        """Check if blockchain service is properly configured"""
        if not self.is_configured:
            raise BlockchainServiceError(
                "Blockchain service is not configured. Please set up blockchain environment variables."
            )
    
    def _get_gas_price(self) -> int:
        """Get current gas price"""
        try:
            gas_price = self.w3.eth.gas_price
            # Add 20% buffer
            return int(gas_price * 1.2)
        except Exception as e:
            logger.warning(f"Failed to get gas price, using default: {str(e)}")
            return self.w3.to_wei('20', 'gwei')
    
    def _estimate_gas(self, transaction: dict) -> int:
        """Estimate gas for a transaction"""
        try:
            return self.w3.eth.estimate_gas(transaction)
        except Exception as e:
            logger.warning(f"Gas estimation failed: {str(e)}")
            return 300000  # Default gas limit
    
    def _send_transaction(self, function_call, value: int = 0) -> str:
        """Send a transaction and return transaction hash"""
        try:
            # Build transaction
            transaction = function_call.build_transaction({
                'from': self.admin_account.address,
                'value': value,
                'gasPrice': self._get_gas_price(),
                'nonce': self.w3.eth.get_transaction_count(self.admin_account.address),
            })
            
            # Estimate gas
            transaction['gas'] = self._estimate_gas(transaction)
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.admin_account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            
            if receipt.status != 1:
                raise BlockchainServiceError(f"Transaction failed: 0x{tx_hash.hex()}")
            
            logger.info(f"Transaction successful: 0x{tx_hash.hex()}")
            return f"0x{tx_hash.hex()}"
            
        except ContractLogicError as e:
            logger.error(f"Contract logic error: {str(e)}")
            raise BlockchainServiceError(f"Contract execution failed: {str(e)}")
        except Exception as e:
            logger.error(f"Transaction failed: {str(e)}")
            raise BlockchainServiceError(f"Transaction failed: {str(e)}")
    
    def register_charity_on_chain(self, name: str, metadata_uri: str, wallet_address: str) -> Tuple[int, str]:
        """
        Register a charity on the blockchain
        
        Args:
            name: Charity name
            metadata_uri: IPFS or HTTP URI for charity metadata
            wallet_address: Charity wallet address
            
        Returns:
            Tuple of (on_chain_id, transaction_hash)
        """
        self._check_configured()
        try:
            # Ensure wallet address is checksum format
            wallet_address = Web3.to_checksum_address(wallet_address)
            
            # Call registerCharity function
            function_call = self.contract.functions.registerCharity(
                wallet_address,
                name,
                metadata_uri
            )
            
            tx_hash = self._send_transaction(function_call)
            
            # Get the charity ID from the event logs
            charity_id = self._get_charity_id_from_tx(tx_hash)
            
            logger.info(f"Charity registered on-chain: ID={charity_id}, TX={tx_hash}")
            return charity_id, tx_hash
            
        except Exception as e:
            logger.error(f"Failed to register charity on-chain: {str(e)}")
            raise BlockchainServiceError(f"Charity registration failed: {str(e)}")
    
    def create_campaign_on_chain(self, charity_on_chain_id: int, title: str, description: str, 
                                goal_amount_wei: int, start_timestamp: int, end_timestamp: int) -> Tuple[int, str]:
        """
        Create a campaign on the blockchain
        
        Args:
            charity_on_chain_id: On-chain charity ID
            title: Campaign title
            description: Campaign description
            goal_amount_wei: Goal amount in wei
            start_timestamp: Start timestamp (Unix)
            end_timestamp: End timestamp (Unix)
            
        Returns:
            Tuple of (on_chain_id, transaction_hash)
        """
        self._check_configured()
        try:
            # Call createCampaign function
            function_call = self.contract.functions.createCampaign(
                charity_on_chain_id,
                title,
                description,
                goal_amount_wei,
                start_timestamp,
                end_timestamp
            )
            
            tx_hash = self._send_transaction(function_call)
            
            # Get the campaign ID from the event logs
            campaign_id = self._get_campaign_id_from_tx(tx_hash)
            
            logger.info(f"Campaign created on-chain: ID={campaign_id}, TX={tx_hash}")
            return campaign_id, tx_hash
            
        except Exception as e:
            logger.error(f"Failed to create campaign on-chain: {str(e)}")
            raise BlockchainServiceError(f"Campaign creation failed: {str(e)}")
    
    def donate_native_on_chain(self, campaign_on_chain_id: int, amount_wei: int, actual_amount_usd: int) -> str:
        """
        Make a native ETH donation on the blockchain
        
        Args:
            campaign_on_chain_id: On-chain campaign ID
            amount_wei: Donation amount in wei (fixed small amount like 0.001 ETH)
            actual_amount_usd: Actual dollar amount donated (in cents)
            
        Returns:
            Transaction hash
        """
        self._check_configured()
        try:
            # Call donateNative function (payable) with actual USD amount
            function_call = self.contract.functions.donateNative(campaign_on_chain_id, actual_amount_usd)
            
            tx_hash = self._send_transaction(function_call, value=amount_wei)
            
            logger.info(f"Native donation made on-chain: TX={tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to make native donation on-chain: {str(e)}")
            raise BlockchainServiceError(f"Donation failed: {str(e)}")
    
    def donate_erc20_on_chain(self, campaign_on_chain_id: int, token_address: str, 
                             amount: int, min_amount: int, actual_amount_usd: int) -> str:
        """
        Make an ERC20 token donation on the blockchain
        
        Args:
            campaign_on_chain_id: On-chain campaign ID
            token_address: ERC20 token contract address
            amount: Donation amount
            min_amount: Minimum amount expected
            actual_amount_usd: Actual dollar amount donated (in cents)
            
        Returns:
            Transaction hash
        """
        try:
            # Ensure token address is checksum format
            token_address = Web3.to_checksum_address(token_address)
            
            # Call donateERC20 function
            function_call = self.contract.functions.donateERC20(
                campaign_on_chain_id,
                token_address,
                amount,
                min_amount,
                actual_amount_usd
            )
            
            tx_hash = self._send_transaction(function_call)
            
            logger.info(f"ERC20 donation made on-chain: TX={tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to make ERC20 donation on-chain: {str(e)}")
            raise BlockchainServiceError(f"ERC20 donation failed: {str(e)}")
    
    def withdraw_funds_on_chain(self, charity_on_chain_id: int, amount_wei: int) -> str:
        """
        Withdraw funds for a charity on the blockchain
        
        Args:
            charity_on_chain_id: On-chain charity ID
            amount_wei: Withdrawal amount in wei
            
        Returns:
            Transaction hash
        """
        self._check_configured()
        try:
            # Call withdrawNative function
            function_call = self.contract.functions.withdrawNative(
                charity_on_chain_id,
                amount_wei
            )
            
            tx_hash = self._send_transaction(function_call)
            
            logger.info(f"Funds withdrawn on-chain: TX={tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to withdraw funds on-chain: {str(e)}")
            raise BlockchainServiceError(f"Fund withdrawal failed: {str(e)}")
    
    def create_campaign_event_on_chain(self, campaign_on_chain_id: int, amount_usd: int, 
                                     title: str, description: str) -> str:
        """
        Create a campaign event on the blockchain
        
        Args:
            campaign_on_chain_id: On-chain campaign ID
            amount_usd: Amount allocated in USD (in cents)
            title: Event title
            description: Event description
            
        Returns:
            Transaction hash
        """
        self._check_configured()
        try:
            # Call createCampaignEvent function
            function_call = self.contract.functions.createCampaignEvent(
                campaign_on_chain_id,
                amount_usd,
                title,
                description
            )
            
            tx_hash = self._send_transaction(function_call)
            
            logger.info(f"Campaign event created on-chain: TX={tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to create campaign event on-chain: {str(e)}")
            raise BlockchainServiceError(f"Campaign event creation failed: {str(e)}")
    
    def _get_charity_id_from_tx(self, tx_hash: str) -> int:
        """Extract charity ID from transaction logs"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            # Look for CharityRegistered event
            charity_registered_abi = {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "internalType": "uint256", "name": "charityId", "type": "uint256"},
                    {"indexed": True, "internalType": "address", "name": "wallet", "type": "address"},
                    {"indexed": False, "internalType": "string", "name": "name", "type": "string"}
                ],
                "name": "CharityRegistered",
                "type": "event"
            }
            
            charity_registered_event = self.contract.events.CharityRegistered()
            events = charity_registered_event.process_receipt(receipt)
            
            if events:
                return events[0]['args']['charityId']
            
            raise BlockchainServiceError("CharityRegistered event not found in transaction")
            
        except Exception as e:
            logger.error(f"Failed to extract charity ID from transaction: {str(e)}")
            raise BlockchainServiceError(f"Failed to get charity ID: {str(e)}")
    
    def _get_campaign_id_from_tx(self, tx_hash: str) -> int:
        """Extract campaign ID from transaction logs"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            # Look for CampaignCreated event
            campaign_created_event = self.contract.events.CampaignCreated()
            events = campaign_created_event.process_receipt(receipt)
            
            if events:
                return events[0]['args']['campaignId']
            
            raise BlockchainServiceError("CampaignCreated event not found in transaction")
            
        except Exception as e:
            logger.error(f"Failed to extract campaign ID from transaction: {str(e)}")
            raise BlockchainServiceError(f"Failed to get campaign ID: {str(e)}")
    
    def get_charity_from_chain(self, charity_on_chain_id: int) -> Dict[str, Any]:
        """Get charity data from the blockchain"""
        try:
            charity_data = self.contract.functions.charities(charity_on_chain_id).call()
            
            return {
                'id': charity_data[0],
                'wallet': charity_data[1],
                'name': charity_data[2],
                'metadata_uri': charity_data[3],
                'approved': charity_data[4],
                'created_at': charity_data[5]
            }
            
        except Exception as e:
            logger.error(f"Failed to get charity from chain: {str(e)}")
            raise BlockchainServiceError(f"Failed to get charity data: {str(e)}")
    
    def get_campaign_from_chain(self, campaign_on_chain_id: int) -> Dict[str, Any]:
        """Get campaign data from the blockchain"""
        try:
            campaign_data = self.contract.functions.campaigns(campaign_on_chain_id).call()
            
            return {
                'id': campaign_data[0],
                'charity_id': campaign_data[1],
                'goal_amount': campaign_data[2],
                'start_at': campaign_data[3],
                'end_at': campaign_data[4],
                'created_at': campaign_data[5],
                'status': campaign_data[6],
                'title': campaign_data[7],
                'description': campaign_data[8]
            }
            
        except Exception as e:
            logger.error(f"Failed to get campaign from chain: {str(e)}")
            raise BlockchainServiceError(f"Failed to get campaign data: {str(e)}")
    
    def get_donation_from_chain(self, donation_on_chain_id: int) -> Dict[str, Any]:
        """Get donation data from the blockchain"""
        try:
            donation_data = self.contract.functions.donations(donation_on_chain_id).call()
            
            return {
                'id': donation_data[0],
                'donor': donation_data[1],
                'charity_id': donation_data[2],
                'campaign_id': donation_data[3],
                'amount_wei': donation_data[4],
                'erc20_amount': donation_data[5],
                'token_type_id': donation_data[6],
                'token_quantity': donation_data[7],
                'timestamp': donation_data[8],
                'erc20_token': donation_data[9]
            }
            
        except Exception as e:
            logger.error(f"Failed to get donation from chain: {str(e)}")
            raise BlockchainServiceError(f"Failed to get donation data: {str(e)}")
    
    def is_connected(self) -> bool:
        """Check if blockchain connection is active"""
        try:
            return self.w3.is_connected()
        except:
            return False
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get blockchain network information"""
        try:
            return {
                'connected': self.is_connected(),
                'chain_id': self.w3.eth.chain_id,
                'latest_block': self.w3.eth.block_number,
                'gas_price': self.w3.eth.gas_price,
                'admin_address': self.admin_account.address if self.admin_account else None
            }
        except Exception as e:
            logger.error(f"Failed to get network info: {str(e)}")
            return {'connected': False, 'error': str(e)}


# Global instance
blockchain_service = BlockchainService()
