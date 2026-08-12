import './style.css';
import { initApp } from './ui/app';

// Донат-ссылку задаёт только веб-версия: мобильные сборки вызывают initApp
// со своими опциями и без supportUrl — донат-ссылок в приложениях магазинов
// быть не должно (их правила).
initApp({ supportUrl: 'https://ko-fi.com/telesik' });
