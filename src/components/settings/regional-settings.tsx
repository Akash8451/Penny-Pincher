
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, CircleDollarSign } from 'lucide-react';

const languages = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
  { value: 'ja-JP', label: '日本語 (日本)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'hi-IN', label: 'हिन्दी (भारत)' },
];

const currencies = [
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'AFN', label: 'AFN - Afghan Afghani' },
  { value: 'ALL', label: 'ALL - Albanian Lek' },
  { value: 'AMD', label: 'AMD - Armenian Dram' },
  { value: 'ANG', label: 'ANG - Netherlands Antillian Guilder' },
  { value: 'AOA', label: 'AOA - Angolan Kwanza' },
  { value: 'ARS', label: 'ARS - Argentine Peso' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'AWG', label: 'AWG - Aruban Florin' },
  { value: 'AZN', label: 'AZN - Azerbaijani Manat' },
  { value: 'BAM', label: 'BAM - Bosnia-Herzegovina Convertible Mark' },
  { value: 'BBD', label: 'BBD - Barbadian Dollar' },
  { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
  { value: 'BGN', label: 'BGN - Bulgarian Lev' },
  { value: 'BHD', label: 'BHD - Bahraini Dinar' },
  { value: 'BIF', label: 'BIF - Burundian Franc' },
  { value: 'BMD', label: 'BMD - Bermudan Dollar' },
  { value: 'BND', label: 'BND - Brunei Dollar' },
  { value: 'BOB', label: 'BOB - Bolivian Boliviano' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'BSD', label: 'BSD - Bahamian Dollar' },
  { value: 'BTN', label: 'BTN - Bhutanese Ngultrum' },
  { value: 'BWP', label: 'BWP - Botswanan Pula' },
  { value: 'BYN', label: 'BYN - Belarusian Ruble' },
  { value: 'BZD', label: 'BZD - Belize Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CDF', label: 'CDF - Congolese Franc' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CLP', label: 'CLP - Chilean Peso' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'COP', label: 'COP - Colombian Peso' },
  { value: 'CRC', label: 'CRC - Costa Rican Colón' },
  { value: 'CUP', label: 'CUP - Cuban Peso' },
  { value: 'CVE', label: 'CVE - Cape Verdean Escudo' },
  { value: 'CZK', label: 'CZK - Czech Koruna' },
  { value: 'DJF', label: 'DJF - Djiboutian Franc' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
  { value: 'DOP', label: 'DOP - Dominican Peso' },
  { value: 'DZD', label: 'DZD - Algerian Dinar' },
  { value: 'EGP', label: 'EGP - Egyptian Pound' },
  { value: 'ERN', label: 'ERN - Eritrean Nakfa' },
  { value: 'ETB', label: 'ETB - Ethiopian Birr' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'FJD', label: 'FJD - Fijian Dollar' },
  { value: 'FKP', label: 'FKP - Falkland Islands Pound' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'GEL', label: 'GEL - Georgian Lari' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'GIP', label: 'GIP - Gibraltar Pound' },
  { value: 'GMD', label: 'GMD - Gambian Dalasi' },
  { value: 'GNF', label: 'GNF - Guinean Franc' },
  { value: 'GTQ', label: 'GTQ - Guatemalan Quetzal' },
  { value: 'GYD', label: 'GYD - Guyanaese Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { value: 'HNL', label: 'HNL - Honduran Lempira' },
  { value: 'HRK', label: 'HRK - Croatian Kuna' },
  { value: 'HTG', label: 'HTG - Haitian Gourde' },
  { value: 'HUF', label: 'HUF - Hungarian Forint' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'ILS', label: 'ILS - Israeli New Shekel' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'IQD', label: 'IQD - Iraqi Dinar' },
  { value: 'IRR', label: 'IRR - Iranian Rial' },
  { value: 'ISK', label: 'ISK - Icelandic Króna' },
  { value: 'JMD', label: 'JMD - Jamaican Dollar' },
  { value: 'JOD', label: 'JOD - Jordanian Dinar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'KGS', label: 'KGS - Kyrgystani Som' },
  { value: 'KHR', label: 'KHR - Cambodian Riel' },
  { value: 'KMF', label: 'KMF - Comorian Franc' },
  { value: 'KPW', label: 'KPW - North Korean Won' },
  { value: 'KRW', label: 'KRW - South Korean Won' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
  { value: 'KYD', label: 'KYD - Cayman Islands Dollar' },
  { value: 'KZT', label: 'KZT - Kazakhstani Tenge' },
  { value: 'LAK', label: 'LAK - Laotian Kip' },
  { value: 'LBP', label: 'LBP - Lebanese Pound' },
  { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
  { value: 'LRD', label: 'LRD - Liberian Dollar' },
  { value: 'LSL', label: 'LSL - Lesotho Loti' },
  { value: 'LYD', label: 'LYD - Libyan Dinar' },
  { value: 'MAD', label: 'MAD - Moroccan Dirham' },
  { value: 'MDL', label: 'MDL - Moldovan Leu' },
  { value: 'MGA', label: 'MGA - Malagasy Ariary' },
  { value: 'MKD', label: 'MKD - Macedonian Denar' },
  { value: 'MMK', label: 'MMK - Myanma Kyat' },
  { value: 'MNT', label: 'MNT - Mongolian Tugrik' },
  { value: 'MOP', label: 'MOP - Macanese Pataca' },
  { value: 'MRO', label: 'MRO - Mauritanian Ouguiya' },
  { value: 'MUR', label: 'MUR - Mauritian Rupee' },
  { value: 'MVR', label: 'MVR - Maldivian Rufiyaa' },
  { value: 'MWK', label: 'MWK - Malawian Kwacha' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { value: 'MZN', label: 'MZN - Mozambican Metical' },
  { value: 'NAD', label: 'NAD - Namibian Dollar' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'NIO', label: 'NIO - Nicaraguan Córdoba' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'NPR', label: 'NPR - Nepalese Rupee' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'OMR', label: 'OMR - Omani Rial' },
  { value: 'PAB', label: 'PAB - Panamanian Balboa' },
  { value: 'PEN', label: 'PEN - Peruvian Nuevo Sol' },
  { value: 'PGK', label: 'PGK - Papua New Guinean Kina' },
  { value: 'PHP', label: 'PHP - Philippine Peso' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee' },
  { value: 'PLN', label: 'PLN - Polish Zloty' },
  { value: 'PYG', label: 'PYG - Paraguayan Guarani' },
  { value: 'QAR', label: 'QAR - Qatari Rial' },
  { value: 'RON', label: 'RON - Romanian Leu' },
  { value: 'RSD', label: 'RSD - Serbian Dinar' },
  { value: 'RUB', label: 'RUB - Russian Ruble' },
  { value: 'RWF', label: 'RWF - Rwandan Franc' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'SBD', label: 'SBD - Solomon Islands Dollar' },
  { value: 'SCR', label: 'SCR - Seychellois Rupee' },
  { value: 'SDG', label: 'SDG - Sudanese Pound' },
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'SHP', label: 'SHP - Saint Helena Pound' },
  { value: 'SLE', label: 'SLE - Sierra Leonean Leone' },
  { value: 'SLL', label: 'SLL - Sierra Leonean Leone' },
  { value: 'SOS', label: 'SOS - Somali Shilling' },
  { value: 'SRD', label: 'SRD - Surinamese Dollar' },
  { value: 'SSP', label: 'SSP - South Sudanese Pound' },
  { value: 'STD', label: 'STD - São Tomé & Príncipe Dobra' },
  { value: 'SYP', label: 'SYP - Syrian Pound' },
  { value: 'SZL', label: 'SZL - Swazi Lilangeni' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'TJS', label: 'TJS - Tajikistani Somoni' },
  { value: 'TMT', label: 'TMT - Turkmenistani Manat' },
  { value: 'TND', label: 'TND - Tunisian Dinar' },
  { value: 'TOP', label: 'TOP - Tongan Paʻanga' },
  { value: 'TRY', label: 'TRY - Turkish Lira' },
  { value: 'TTD', label: 'TTD - Trinidad & Tobago Dollar' },
  { value: 'TWD', label: 'TWD - New Taiwan Dollar' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
  { value: 'UAH', label: 'UAH - Ukrainian Hryvnia' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling' },
  { value: 'USD', label: 'USD - United States Dollar' },
  { value: 'UYU', label: 'UYU - Uruguayan Peso' },
  { value: 'UZS', label: 'UZS - Uzbekistan Som' },
  { value: 'VES', label: 'VES - Venezuelan Bolívar Soberano' },
  { value: 'VND', label: 'VND - Vietnamese Dong' },
  { value: 'VUV', label: 'VUV - Vanuatu Vatu' },
  { value: 'WST', label: 'WST - Samoan Tala' },
  { value: 'XAF', label: 'XAF - CFA Franc BEAC' },
  { value: 'XCD', label: 'XCD - East Caribbean Dollar' },
  { value: 'XDR', label: 'XDR - Special Drawing Rights' },
  { value: 'XOF', label: 'XOF - CFA Franc BCEAO' },
  { value: 'XPF', label: 'XPF - CFP Franc' },
  { value: 'YER', label: 'YER - Yemeni Rial' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'ZMW', label: 'ZMW - Zambian Kwacha' },
  { value: 'ZWL', label: 'ZWL - Zimbabwean Dollar' },
];

export default function RegionalSettings() {
  const [language, setLanguage] = useLocalStorage('language', 'en-US');
  const [currency, setCurrency] = useLocalStorage('currency', 'USD');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="text-primary" />
          Language & Currency
        </CardTitle>
        <CardDescription>
          Choose your preferred language and currency for the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="language-select">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency-select">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency-select">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(curr => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
