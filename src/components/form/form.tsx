import { useState } from 'react';
import { AutoComplete, Empty, Form, Select} from 'antd';
import * as S from './form.styled';
import { PrimaryButton } from '../primary-button';
import { debounce } from "debounce";
import { CryptoChart } from '../chart';
import axios from 'axios';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const intervalOptions = [
  { label: '1 day', value: 'm5' },
  { label: '3 days', value: 'm15' },
  { label: '1 week', value: 'm30' },
  { label: '1 month', value: 'h2' },
  { label: '6 months', value: 'h12' },
  { label: '1 year', value: 'd1' },
  { label: '5 years', value: 'd1' },
];

const CryptoForm = () => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<{ name: string; id: string, symbol: string }[]>([]);
  const [selectedCryptoPrice, setSelectedCryptoPrice] = useState<number[]>([]);
  const [selectedCryptoTime, setSelectedCryptoTime] = useState<string[]>([]);
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null);
  const [isClicked, setClicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (value: string) => {
    try {
      const response = await axios.get('https://api.coincap.io/v2/assets', {
        params: {
          limit: 1200
        },
      });
      const cryptoList = response.data.data;
      const suggestions = cryptoList.filter((crypto: any) => crypto.name.toLowerCase().includes(value.toLowerCase()));
      setOptions(suggestions);

    } catch (error) {
      console.error('Error fetching cryptocurrency suggestions', error);
    }
  };

  const debouncedHandleSearch = debounce(handleSearch, 500);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      const selectedCryptoName = form.getFieldValue('crypto');
      const selectedCrypto = options.find((crypto) => crypto.name === selectedCryptoName);
      const id = selectedCrypto?.id;
      const symbol = selectedCrypto?.symbol;

      if (symbol) {
        setSelectedCryptoSymbol(symbol);
      }

      const selectedIntervalOption = form.getFieldValue('interval');
      const selectedInterval = intervalOptions.find(option => option.label === selectedIntervalOption)?.value;
      let startDate;

      if (selectedIntervalOption === '1 day') {
        startDate = dayjs().subtract(1, 'day');
      } else if (selectedIntervalOption === '3 days') {
        startDate = dayjs().subtract(3, 'days');
      } else if (selectedIntervalOption === '1 week') {
        startDate = dayjs().subtract(1, 'week');
      } else if (selectedIntervalOption === '1 month') {
        startDate = dayjs().subtract(1, 'month');
      } else if (selectedIntervalOption === '6 months') {
        startDate = dayjs().subtract(6, 'months');
      } else if (selectedIntervalOption === '1 year') {
        startDate = dayjs().subtract(1, 'year');
      } else if (selectedIntervalOption === '5 years') {
        startDate = dayjs().subtract(5, 'years');
      }

      const startUnixTimestamp = dayjs(startDate).valueOf();
      const endUnixTimestamp = dayjs().valueOf();

      const response = await axios.get(`https://api.coincap.io/v2/assets/${id}/history?interval=${selectedInterval}`, {
        params: {
          start: startUnixTimestamp,
          end: endUnixTimestamp,
        },
      });

      const selectedCryptoData = response.data.data;

      const cryptoPrices = selectedCryptoData.map((item: any) => item.priceUsd);
      const CryptoTimestamps = selectedCryptoData.map((item: any) => {
        const timestamp = item.time;
        const formattedDate = dayjs.unix(timestamp / 1000).format('YYYY-MM-DD HH:mm');
        return formattedDate;
      });

      setSelectedCryptoPrice(cryptoPrices);
      setSelectedCryptoTime(CryptoTimestamps);

    } catch (error) {
      console.error('Error fetching cryptocurrency data', error);
      setError('Something went wrong, please try again later');
    } finally {
      setLoading(false);

      if (selectedCryptoPrice.length === 0) {
        setHasNoData(true);
      };      
    }
  };

  return (
    <>
      <S.FormWrapper>
        <S.FormTitle>Find over <span>1000</span> cryptocurrencies</S.FormTitle>
        <S.StyledForm
          onFinish={handleSubmit}
          form={form}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Cryptocurrency"
            name="crypto"
            rules={[
              {
                required: true,
                message: 'Please select cryptocurrency',
                validateTrigger: 'onSubmit',
              }
            ]}
            trigger="onSelect"
            valuePropName=""
          >
            <AutoComplete 
              autoFocus={false} 
              size='large'
              maxLength={30}
              placeholder='e.g. Bitcoin'
              notFoundContent='No cryptocurrency'
              options={options.map((crypto: any) => ({
                value: crypto.name,
                label: crypto.name,
                key: crypto.id
              }))}
              onSearch={debouncedHandleSearch}
            />
          </Form.Item>
          <Form.Item
            label="Time interval"
            name="interval"
            rules={[
              {
                required: true,
                message: 'Please choose an interval',
              },
            ]}
          >
            <Select 
            autoFocus={false}
            size='large'
            // placeholder="kkk"
            >
              {intervalOptions.map((option) => (
                <Select.Option key={uuidv4()} value={option.label} >
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <PrimaryButton
            htmlType='submit'
            loading={loading}
            onClick={() => { form.submit(); setClicked(true) }}
          >
            Search
          </PrimaryButton >
          {/* {error && <div className='errorMessage'>{error}</div>} */}
        </S.StyledForm>
      </S.FormWrapper>
      {/* {isClicked && selectedCryptoPrice.length > 0 && 
      <CryptoChart 
        cryptoPrice={selectedCryptoPrice} 
        time={selectedCryptoTime} 
        cryptoName={form.getFieldValue('crypto')} 
        cryptoSymbol={selectedCryptoSymbol || ''}
      />}
      {hasNoData && selectedCryptoPrice.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />} */}
      {/* {isClicked && selectedCryptoPrice.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />} */}

      {isClicked && (
        error ? (
          <S.ErrorMessage>{error}</S.ErrorMessage>
        ) : (
          selectedCryptoPrice.length > 0 ? (
            <CryptoChart
              cryptoPrice={selectedCryptoPrice}
              time={selectedCryptoTime}
              cryptoName={form.getFieldValue('crypto')}
              cryptoSymbol={selectedCryptoSymbol || ''}
            />
          ) : (hasNoData &&
            <S.EmptyData image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )
        )
      )}

    </>
  )
}

export default CryptoForm