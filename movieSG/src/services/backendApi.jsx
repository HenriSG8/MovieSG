import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:3001/'
});

export default backendApi;
