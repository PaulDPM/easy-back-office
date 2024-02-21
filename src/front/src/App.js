import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { useEffect, useState } from "react";
import './App.css';
import Sidebar from './components/Sidebar'
import RedirectToFirstView from './components/RedirectToFirstView'
import CreateRecord from './pages/CreateRecord'
import EditRecord from './pages/EditRecord'
import Records from './pages/Records'
import Record from './pages/Record'
import Login from './pages/Login'
import Iframe from './pages/Iframe'
import CustomView from './pages/CustomView'
import { ConfigProvider } from './contexts/ConfigContext'
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NODE_ENV === "development" ? 'http://localhost/admin/api' : '/_HOMEPAGE_/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    axios.get("/isAuthenticated").then((response) => {
      setIsAuthenticated(response.data.isAuthenticated)
    })
  }, []);
  
  const logout = () => {
    setIsAuthenticated(false)
    axios.get("/logout")
  }

  return (
    <div id="body">
      {isAuthenticated === true ? (
        <ConfigProvider>
          <Router basename={process.env.NODE_ENV === "development" ? '/admin' : "/_HOMEPAGE_"}>
            <Sidebar logout={logout} />
            <Switch>
              <Route path="/records/:viewIndex/:subviewIndex?">
                <Records />
              </Route>
              <Route path="/record/:viewIndex/:recordId">
                <Record />
              </Route>
              <Route path="/editRecord/:viewIndex/:recordId">
                <EditRecord />
              </Route>
              <Route path="/createRecord/:viewIndex/:panelIndex?/:recordId?">
                <CreateRecord />
              </Route>
              <Route path="/iframe/:viewIndex">
                <Iframe />
              </Route>
              <Route path="/customView/:viewIndex">
                <CustomView />
              </Route>
              <Route path="/">
                <RedirectToFirstView />
              </Route>
            </Switch>
          </Router>
        </ConfigProvider>
      ) : isAuthenticated === false ? (
        <Login setIsAuthenticated={setIsAuthenticated} />
      ) : (
        <div class="appLoading">
          <i class='fa fa-circle-notch fa-spin'></i>
        </div>
      )}
    </div>
  );
}

export default App;
