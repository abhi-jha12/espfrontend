import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from 'firebase/database';
import Thermometer from "react-thermometer-component";
import Papa from 'papaparse';


const firebaseConfig = {
  apiKey: "AIzaSyCa9dXK3OPYX66GQ43tTl3vaq40wulkEb0",
  authDomain: "sensordemo-84cd6.firebaseapp.com",
  databaseURL: "https://sensordemo-84cd6-default-rtdb.firebaseio.com",
  projectId: "sensordemo-84cd6",
  storageBucket: "sensordemo-84cd6.appspot.com",
  messagingSenderId: "353814233997",
  appId: "1:353814233997:web:da3767ab0d30384c9cf3c4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const csvData = [];

function App() {
  const [temperature, setTemperature] = useState(null);
  const [desiredTemperature, setDesiredTemperature] = useState(null);
  const [formattedUptime, setFormattedUptime] = useState("--");
  useEffect(() => {
    const temperatureRef = ref(database, 'sensorData/temperature');
    onValue(temperatureRef, (snapshot) => {
      setTemperature(snapshot.val());
    });
  }, []);
  useEffect(() => {
    const database = getDatabase();
    const temperatureset = ref(database, 'sensorData/desiredTemperature');
    onValue(temperatureset, (snapshot) => {
      setDesiredTemperature(snapshot.val()); // Set default if not found
    });
  }, []);


  useEffect(() => {
    const database = getDatabase();
    const timeref = ref(database, 'sensorData/uptime');
    onValue(timeref, (snapshot) => {
      const uptime = snapshot.val(); // Get uptime in milliseconds

      // Convert uptime to days, hours, and minutes
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

      // Format the uptime string
      const formattedUptime = `${days}d ${hours}h ${minutes}m`;

      setFormattedUptime(formattedUptime); // Update the formatted uptime state
    });
  }, []);
  useEffect(() => {
    const temperatureRef = ref(database, 'sensorData/temperature');
    const uptimeRef = ref(database, 'sensorData/uptime');

    const handleTemperatureChange = (snapshot) => {
      setTemperature(snapshot.val());
      csvData.push({ timestamp: Date.now(), temperature: snapshot.val() }); // Add data to CSV array
    };

    const handleUptimeChange = (snapshot) => {
      const uptime = snapshot.val();
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const formattedUptime = `${days}d ${hours}h ${minutes}m`;
      setFormattedUptime(formattedUptime);
    };

    onValue(temperatureRef, handleTemperatureChange);
    onValue(uptimeRef, handleUptimeChange);

    return () => {
      onValue(temperatureRef, handleTemperatureChange, { onlyOnce: true });
      onValue(uptimeRef, handleUptimeChange, { onlyOnce: true });
    };
  }, []);

  const handleInputChange = (event) => {
    setDesiredTemperature(Number(event.target.value));
  };
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!desiredTemperature) {

      console.error('Please enter a desired temperature.');
      return;
    }
    set(ref(database, 'sensorData/'), {
      desiredTemperature: desiredTemperature
    });
    // Update desired temperature in Firebase

    // Display confirmation or success message
    console.log('Desired temperature updated:', desiredTemperature);
    // Optional: Show a confirmation message to the user
  };

  const handleDownloadCSV = () => {
    // Convert CSV data array to string
    const csvString = Papa.unparse(csvData, {
      header: true, // Add header row with "timestamp" and "temperature" columns
    });

    // Create a hidden anchor element
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob([csvString], { type: 'text/csv;charset=utf-8;' }));
    downloadLink.download = 'sensor_data.csv';
    downloadLink.click();
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col gap-4 items-center justify-center h-screen">
        <h2 className="text-3xl font-bold text-center tracking-widest">SENSOR 1</h2>
        <div className="flex justify-center">
          <Thermometer
            theme="dark"
            value={temperature}
            max="100"
            steps="1"
            format="°C"
            size="large"
            height="320"
          />
        </div>
        <h3 className="text-xl font-bold text-center mt-5 -mb-3 tracking-widest">SETPOINT</h3>
        <div className="flex justify-center mt-4">

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="number"
              placeholder="Enter desired temperature setpoint (°C)"
              value={desiredTemperature}
              onChange={handleInputChange}
              style={{ height: '30px' }}
              className="text-gray-700 border-2 border-black rounded-xl px-4 py-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-black hover:bg-white text-white hover:text-black border-2 border-black font-bold py-2 px-4 rounded-xl tracking-widest">
              Set Temperature
            </button>
          </form>
        </div>
        <h3 className="text-xl font-bold text-center mt-1 tracking-widest">UPTIME: {formattedUptime}</h3>
        <button onClick={handleDownloadCSV} className='bg-black hover:bg-white text-white hover:text-black border-2 border-black font-bold py-2 px-4 rounded-xl tracking-widest'>Download Data</button>
      </div>
    </div>
  );
}

export default App;