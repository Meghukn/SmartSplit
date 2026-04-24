import {BrowserRouter,Routes,Route} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupPage from "./pages/GroupPage";
import SettlementPage from "./pages/SettlementPage";

function App(){

  return(

    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/create-group" element={<CreateGroup/>}/>
        <Route path="/group/:groupId" element={<GroupPage/>}/>
        <Route path="/settlement/:groupId" element={<SettlementPage />} />
      </Routes>

    </BrowserRouter>

  );

}

export default App;