import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  User,
  Charity,
  Campaign,
  CampaignList,
  Donation,
  DonationCreate,
  Token,
  OnChainTransaction,
  CharityStats,
  CampaignStats,
  DonationStats,
  TransactionStats,
  PaginatedResponse,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://127.0.0.1:8000/api/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    this.token = localStorage.getItem('access_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.token) {
          // Token expired, try to refresh
          try {
            await this.refreshToken();
            // Retry the original request
            return this.api.request(error.config);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/api/users/login/', {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      this.setAuthToken(access);
    } catch (error) {
      this.clearAuthToken();
      throw error;
    }
  }

  logout() {
    this.clearAuthToken();
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post(
      '/users/login/',
      credentials
    );
    
    const { access, refresh } = response.data;
    this.setAuthToken(access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/');
    return response.data[0]; // Assuming we get current user as first item
  }

  // Charity endpoints
  async getCharities(params?: {
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<Charity>> {
    const response = await this.api.get('/charities/', { params });
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      // Backend returns plain array, wrap it in paginated format
      return {
        results: response.data,
        count: response.data.length,
        next: undefined,
        previous: undefined,
      };
    }
    
    // Backend returns paginated response
    return response.data;
  }

  async getCharity(id: string): Promise<Charity> {
    const response: AxiosResponse<Charity> = await this.api.get(`/charities/${id}/`);
    return response.data;
  }

  async createCharity(charity: Partial<Charity>): Promise<Charity> {
    const response: AxiosResponse<Charity> = await this.api.post('/charities/', charity);
    return response.data;
  }

  async updateCharity(id: string, charity: Partial<Charity>): Promise<Charity> {
    const response: AxiosResponse<Charity> = await this.api.patch(`/charities/${id}/`, charity);
    return response.data;
  }

  async deleteCharity(id: string): Promise<void> {
    await this.api.delete(`/charities/${id}/`);
  }

  async getCharityCampaigns(id: string): Promise<CampaignList[]> {
    const response: AxiosResponse<CampaignList[]> = await this.api.get(
      `/charities/${id}/campaigns/`
    );
    return response.data;
  }

  async getCharityDonations(id: string): Promise<Donation[]> {
    const response: AxiosResponse<Donation[]> = await this.api.get(
      `/charities/${id}/donations/`
    );
    return response.data;
  }

  async getCharityStats(id: string): Promise<CharityStats> {
    const response: AxiosResponse<CharityStats> = await this.api.get(
      `/charities/${id}/statistics/`
    );
    return response.data;
  }

  // Campaign endpoints
  async getCampaigns(params?: {
    search?: string;
    ordering?: string;
    status?: 'active' | 'upcoming' | 'ended';
    progress?: 'completed' | 'active';
    page?: number;
  }): Promise<PaginatedResponse<CampaignList>> {
    const response = await this.api.get('/campaigns/', { params });
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      // Backend returns plain array, wrap it in paginated format
      return {
        results: response.data,
        count: response.data.length,
        next: undefined,
        previous: undefined,
      };
    }
    
    // Backend returns paginated response
    return response.data;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.api.get(`/campaigns/${id}/`);
    return response.data;
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.api.post('/campaigns/', campaign);
    return response.data;
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.api.patch(`/campaigns/${id}/`, campaign);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.api.delete(`/campaigns/${id}/`);
  }

  async getCampaignDonations(id: string): Promise<Donation[]> {
    const response: AxiosResponse<Donation[]> = await this.api.get(
      `/campaigns/${id}/donations/`
    );
    return response.data;
  }

  async donateToCampaign(id: string, donation: DonationCreate): Promise<Donation> {
    const response: AxiosResponse<Donation> = await this.api.post(
      `/campaigns/${id}/donate/`,
      donation
    );
    return response.data;
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    const response: AxiosResponse<CampaignStats> = await this.api.get(
      `/campaigns/${id}/statistics/`
    );
    return response.data;
  }

  // Donation endpoints
  async getDonations(params?: {
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<Donation>> {
    const response: AxiosResponse<PaginatedResponse<Donation>> = await this.api.get(
      '/donations/',
      { params }
    );
    return response.data;
  }

  async getDonation(id: string): Promise<Donation> {
    const response: AxiosResponse<Donation> = await this.api.get(`/donations/${id}/`);
    return response.data;
  }

  async createDonation(donation: DonationCreate): Promise<Donation> {
    const response: AxiosResponse<Donation> = await this.api.post('/donations/', donation);
    return response.data;
  }

  async getMyDonationStats(): Promise<DonationStats> {
    const response: AxiosResponse<DonationStats> = await this.api.get(
      '/donations/my_statistics/'
    );
    return response.data;
  }

  // Token endpoints
  async getTokens(params?: {
    search?: string;
    ordering?: string;
    charity?: string;
    page?: number;
  }): Promise<PaginatedResponse<Token>> {
    const response: AxiosResponse<PaginatedResponse<Token>> = await this.api.get(
      '/tokens/',
      { params }
    );
    return response.data;
  }

  async getToken(id: string): Promise<Token> {
    const response: AxiosResponse<Token> = await this.api.get(`/tokens/${id}/`);
    return response.data;
  }

  async createToken(token: Partial<Token>): Promise<Token> {
    const response: AxiosResponse<Token> = await this.api.post('/tokens/', token);
    return response.data;
  }

  async updateToken(id: string, token: Partial<Token>): Promise<Token> {
    const response: AxiosResponse<Token> = await this.api.patch(`/tokens/${id}/`, token);
    return response.data;
  }

  async deleteToken(id: string): Promise<void> {
    await this.api.delete(`/tokens/${id}/`);
  }

  async getTokenTransactions(id: string): Promise<OnChainTransaction[]> {
    const response: AxiosResponse<OnChainTransaction[]> = await this.api.get(
      `/tokens/${id}/transactions/`
    );
    return response.data;
  }

  async getTokenStats(id: string): Promise<{
    total_transactions: number;
    total_volume: number;
    unique_addresses: number;
    token_value_lkr: number;
    total_value_lkr: number;
    charity: string;
  }> {
    const response = await this.api.get(`/tokens/${id}/statistics/`);
    return response.data;
  }

  // Transaction endpoints
  async getTransactions(params?: {
    search?: string;
    ordering?: string;
    token?: string;
    charity?: string;
    address?: string;
    page?: number;
  }): Promise<PaginatedResponse<OnChainTransaction>> {
    const response: AxiosResponse<PaginatedResponse<OnChainTransaction>> = await this.api.get(
      '/transactions/',
      { params }
    );
    return response.data;
  }

  async getTransaction(id: string): Promise<OnChainTransaction> {
    const response: AxiosResponse<OnChainTransaction> = await this.api.get(
      `/transactions/${id}/`
    );
    return response.data;
  }

  async createTransaction(transaction: Partial<OnChainTransaction>): Promise<OnChainTransaction> {
    const response: AxiosResponse<OnChainTransaction> = await this.api.post(
      '/transactions/',
      transaction
    );
    return response.data;
  }

  async getTransactionsByAddress(address: string): Promise<OnChainTransaction[]> {
    const response: AxiosResponse<OnChainTransaction[]> = await this.api.get(
      '/transactions/by_address/',
      { params: { address } }
    );
    return response.data;
  }

  async getTransactionStats(): Promise<TransactionStats> {
    const response: AxiosResponse<TransactionStats> = await this.api.get(
      '/transactions/statistics/'
    );
    return response.data;
  }
}

export default new ApiService();
