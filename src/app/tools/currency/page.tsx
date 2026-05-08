'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

const commonCurrencies = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'Fr' },
  { code: 'HKD', name: '港元', symbol: 'HK$' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
];

// 模拟汇率数据（实际应该从 API 获取）
const mockRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  CNY: 7.24,
  JPY: 151.5,
  GBP: 0.79,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  HKD: 7.82,
  SGD: 1.35,
  KRW: 1380,
  INR: 83.5,
};

export default function CurrencyConverter() {
  const locale = useLocale();
  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载汇率
  const loadRates = async () => {
    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const exchangeRates: ExchangeRate[] = commonCurrencies.map(curr => ({
        currency: curr.code,
        rate: mockRates[curr.code],
        change: (Math.random() - 0.5) * 0.5,
        changePercent: (Math.random() - 0.5) * 2,
      }));
      
      setRates(exchangeRates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // 计算转换
  useEffect(() => {
    if (rates.length > 0) {
      const fromRate = rates.find(r => r.currency === fromCurrency)?.rate || 1;
      const toRate = rates.find(r => r.currency === toCurrency)?.rate || 1;
      const rate = toRate / fromRate;
      
      setExchangeRate(rate);
      setConvertedAmount(amount * rate);
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-slate-900">{locale === 'zh' ? '汇率计算器' : 'Currency Calculator'}</h1>
          </div>
          <p className="text-slate-600">
            {locale === 'zh' ? '实时汇率转换，支持国际贸易主要货币' : 'Real-time currency conversion for major international trade currencies'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 转换器 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">{locale === 'zh' ? '货币转换' : 'Currency Conversion'}</h2>
                <button
                  onClick={loadRates}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {locale === 'zh' ? '刷新汇率' : 'Refresh Rates'}
                </button>
              </div>

              <div className="space-y-6">
                {/* 金额输入 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {locale === 'zh' ? '金额' : 'Amount'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 货币选择 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {locale === 'zh' ? '从' : 'From'}
                    </label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {commonCurrencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center pb-3">
                    <button
                      onClick={handleSwap}
                      className="p-3 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {locale === 'zh' ? '到' : 'To'}
                    </label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {commonCurrencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 转换结果 */}
                <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg p-6 mt-6">
                  <div className="text-sm text-slate-600 mb-2">{locale === 'zh' ? '转换结果' : 'Conversion Result'}</div>
                  <div className="text-4xl font-bold text-slate-900 mb-2">
                    {convertedAmount.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} {toCurrency}
                  </div>
                  <div className="text-sm text-slate-600">
                    {locale === 'zh' ? '汇率' : 'Exchange Rate'}：1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {locale === 'zh' ? '最后更新' : 'Last Updated'}：{lastUpdated?.toLocaleString('zh-CN') || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 汇率列表 */}
          <div>
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{locale === 'zh' ? '热门汇率' : 'Popular Rates'}</h2>
              
              <div className="space-y-3">
                {rates.map(rate => {
                  const isPositive = rate.change >= 0;
                  return (
                    <div
                      key={rate.currency}
                      className={`p-4 rounded-lg border ${
                        rate.currency === fromCurrency || rate.currency === toCurrency
                          ? 'bg-primary-50 border-primary-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{rate.currency}</span>
                        <span className="text-lg font-bold text-slate-900">
                          {rate.rate.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? '+' : ''}{rate.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-slate-500 text-center">
                {locale === 'zh' ? '数据仅供参考，实际交易以银行汇率为准' : 'Data for reference only. Actual rates may vary.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
