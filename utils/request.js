const axios = require('axios').default;

async function request(path='', method='GET', data={}) {
    try {
        return await _makeRequest(path, method, data);
    } catch (err) {
        throw err;   
    }
}

function _makeRequest(path, method, data) {
    try {
        switch (method.toUpperCase()) {
            case 'GET':
                return axios.get(path);
            case 'POST':
                return axios.post(path, data);
        }
    } catch (err) {
        console.log('Error on request: ', err);
        throw err;
    }
}

exports.request = request;