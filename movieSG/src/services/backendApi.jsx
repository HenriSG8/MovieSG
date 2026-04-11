import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://192.168.0.236:3000/'
});

export default backendApi;
