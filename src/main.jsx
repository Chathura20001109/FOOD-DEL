import  React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; 
import StoreContextProvider from './context/StoreContext.jsx';


// Make sure to use 'createRoot' correctly for React 18+.
ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
    <StoreContextProvider>
       <App />
    </StoreContextProvider> 
   
      
    </BrowserRouter>

);
