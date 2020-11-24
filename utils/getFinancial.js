const { request } = require('./request');

exports.getPriceByTicket = async (name) => {
    try {

        const { index, symbol } = _parseNameToTicket(name);
        const path = `http://financial-env.eba-bvgmimpg.us-east-1.elasticbeanstalk.com/getFinancial/${index}/${symbol}`;
        const { data } = await request(path, 'GET');

        console.log('Data from request: ', data);

        return _handleMessage(data.symbol, data.companyName, data.last);
    } catch (err) {

        throw err;
    }
};

function _parseNameToTicket(name) {
    switch (name.toLowerCase()) {
        case 'vale':
            return { index: 'BVMF', symbol: 'VALE3' };
        case 'americanas':
            return { index: 'BVMF', symbol: 'LAME4' };
        case 'magalu':
        case 'magazine luiza':
            return { index: 'BVMF', symbol: 'MGLU3' };
        case 'via varejo':
            return { index: 'BVMF', symbol: 'VVAR3'}
        default:
            return { index: 'INDEXBVMF', symbol: 'IBOV' };
    }
}

function _handleMessage(symbol, companyName, lastValue) {
    const splitedSymbol = symbol.split(':');

    if (splitedSymbol[0] === 'INDEXBVMF') {
        return `O último valor do índice ${companyName} está valendo ${Math.round(lastValue)} pontos.`;
    }

    return `O último valor da ação da empresa ${companyName} está custando R$${lastValue}.`;
}

