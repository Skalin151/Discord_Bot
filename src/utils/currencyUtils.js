import fetch from 'node-fetch';

const API_KEY = process.env.EXCHANGE_API_KEY;

export async function convertUAHtoEUR(amountUAH) {
  try {
    let url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/UAH`;
    const res = await fetch(url);
    const data = await res.json();
    const rate = data.conversion_rates?.EUR;
    if (!rate) return null;
    return (amountUAH * rate).toFixed(2);
  } catch (e) {
    return null;
  }
}

export async function convertEURtoUAH(amountEUR) {
  try {
    let url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EUR`;
    const res = await fetch(url);
    const data = await res.json();
    const rate = data.conversion_rates?.UAH;
    if (!rate) return null;
    return (amountEUR * rate).toFixed(2);
  } catch (e) {
    return null;
  }
}
