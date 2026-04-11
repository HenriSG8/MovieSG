import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://185.225.233.145:3001/'
});

export default backendApi;
