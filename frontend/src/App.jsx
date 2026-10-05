import {
   BrowserRouter as Router,
   Routes,
   Route,
   Navigate,
} from "react-router-dom";
import Login from "./Login";
import Signup from "./SignUp";
import Dashboard from "./DashBoard";
import WebcamCapture from "./WebcamCapture";
import Profile from "./Profile";

function App() {
   return (
      <Router>
         <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exercise" element={<WebcamCapture />} />
            <Route path="/profile" element={<Profile />} />
         </Routes>
      </Router>
   );
}

export default App;
