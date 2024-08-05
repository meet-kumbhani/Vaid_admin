import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase.config';
import { Form } from 'react-bootstrap';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBHyngtjTulkJ96GKevrg7jpxwypD1Kx-k';

const reverseGeocode = async (lat, lng) => {
     try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
          const data = await response.json();
          if (data.results.length > 0) {
               return data.results[0].formatted_address;
          }
          return 'Unknown location';
     } catch (error) {
          console.error('Error in reverse geocoding: ', error);
          return 'Error fetching location';
     }
};

const EmployeeDetails = () => {
     const { id } = useParams();
     const [employee, setEmployee] = useState(null);
     const [loading, setLoading] = useState(true);
     const [time, setTime] = useState(0);
     const [isActive, setIsActive] = useState(false);
     const [isPaused, setIsPaused] = useState(false);
     const [clients, setClients] = useState([]);
     const [selectedClient, setSelectedClient] = useState('');
     const [startTime, setStartTime] = useState(null);
     const intervalRef = useRef(null);
     const [startLocation, setStartLocation] = useState(null);
     const [endLocation, setEndLocation] = useState(null);
     const [periodicLocation, setPeriodicLocation] = useState(null);
     const [status, setStatus] = useState('active');
     const [submitLocation, setSubmitLocation] = useState(null);
     const [attendanceRecords, setAttendanceRecords] = useState([]);
     console.log(attendanceRecords, "<-- attandance");

     useEffect(() => {
          const fetchEmployee = async () => {
               try {
                    const docRef = doc(db, 'users', id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                         setEmployee(docSnap.data());
                    } else {
                         console.log('No such document!');
                    }
               } catch (error) {
                    console.error('Error fetching document: ', error);
               } finally {
                    setLoading(false);
               }
          };

          fetchEmployee();
     }, [id]);

     useEffect(() => {
          const fetchClients = async () => {
               try {
                    const clientsQuery = query(collection(db, 'users'), where("role", "array-contains", "client"));
                    const querySnapshot = await getDocs(clientsQuery);
                    const clientsList = querySnapshot.docs.map((doc) => ({
                         id: doc.id,
                         ...doc.data(),
                    }));
                    setClients(clientsList);
               } catch (error) {
                    console.error('Error fetching clients: ', error);
               }
          };

          fetchClients();
     }, []);

     useEffect(() => {
          if (isActive && !isPaused) {
               intervalRef.current = setInterval(() => {
                    setTime((prevTime) => prevTime + 1);
                    getCurrentLocation();
               }, 1000);
          } else {
               clearInterval(intervalRef.current);
          }
          return () => clearInterval(intervalRef.current);
     }, [isActive, isPaused]);

     useEffect(() => {
          const fetchAttendance = async () => {
               try {
                    const attendanceQuery = query(collection(db, 'attendance'), where('userId', '==', id));
                    const querySnapshot = await getDocs(attendanceQuery);
                    const attendanceList = await Promise.all(querySnapshot.docs.map(async (doc) => {
                         const data = doc.data();
                         const startLocationName = data.startLocation ? await reverseGeocode(data.startLocation.latitude, data.startLocation.longitude) : 'Unknown';
                         const endLocationName = data.endLocation ? await reverseGeocode(data.endLocation.latitude, data.endLocation.longitude) : 'Unknown';
                         const submitLocationName = data.submitLocation ? await reverseGeocode(data.submitLocation.latitude, data.submitLocation.longitude) : 'Unknown';

                         return {
                              ...data,
                              startLocation: startLocationName,
                              endLocation: endLocationName,
                              submitLocation: submitLocationName,
                         };
                    }));
                    setAttendanceRecords(attendanceList);
               } catch (error) {
                    console.error('Error fetching attendance records: ', error);
               }
          };

          fetchAttendance();
     }, [id]);

     const getCurrentLocation = () => {
          navigator.geolocation.getCurrentPosition(
               async (position) => {
                    const { latitude, longitude } = position.coords;
                    const timestamp = new Date().toISOString();
                    const location = { latitude, longitude, timestamp };

                    setPeriodicLocation(location);

                    if (isActive && !isPaused && !startLocation) {
                         setStartLocation(location);
                    }
                    if (isActive && !isPaused) {
                         setEndLocation(location);
                    }
                    if (!submitLocation) {
                         setSubmitLocation(location);
                    }
               },
               (error) => console.error('Error getting location: ', error)
          );
     };

     const handleStart = () => {
          setIsActive(true);
          setIsPaused(false);
          setStartTime(Date.now());
          getCurrentLocation();
     };

     const handlePause = () => {
          setIsPaused(!isPaused);
     };

     const handleStop = () => {
          setIsActive(false);
          getCurrentLocation();
          setEndLocation(null);
     };

     const handleSubmit = async () => {
          if (!employee) {
               console.error("Employee data is missing");
               return;
          }
          if (!selectedClient) {
               console.error("Selected client is missing");
               return;
          }
          if (!startTime) {
               console.error("Start time is missing");
               return;
          }

          const endTime = Date.now();
          const attendanceData = {
               userId: id,
               startTime: new Date(startTime).toISOString(),
               endTime: new Date(endTime).toISOString(),
               startLocation: startLocation || { latitude: 'Unknown', longitude: 'Unknown' },
               endLocation: endLocation || { latitude: 'Unknown', longitude: 'Unknown' },
               periodicLocation: periodicLocation,
               status: status,
               createdAt: new Date().toISOString(),
               clientId: selectedClient,
               submitLocation: submitLocation || { latitude: 'Unknown', longitude: 'Unknown' },
               submitTime: new Date().toISOString(),
          };

          try {
               await addDoc(collection(db, 'attendance'), attendanceData);
               console.log("Submission saved successfully");
               const attendanceQuery = query(collection(db, 'attendance'), where('userId', '==', id));
               const querySnapshot = await getDocs(attendanceQuery);
               const attendanceList = await Promise.all(querySnapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    const startLocationName = data.startLocation ? await reverseGeocode(data.startLocation.latitude, data.startLocation.longitude) : 'Unknown';
                    const endLocationName = data.endLocation ? await reverseGeocode(data.endLocation.latitude, data.endLocation.longitude) : 'Unknown';
                    const submitLocationName = data.submitLocation ? await reverseGeocode(data.submitLocation.latitude, data.submitLocation.longitude) : 'Unknown';

                    return {
                         ...data,
                         startLocation: startLocationName,
                         endLocation: endLocationName,
                         submitLocation: submitLocationName,
                    };
               }));
               setAttendanceRecords(attendanceList);
          } catch (error) {
               console.error("Error saving submission: ", error);
          }
          setTime(0)
     };

     if (loading) {
          return <div>Loading...</div>;
     }

     if (!employee) {
          return <div>No employee data found</div>;
     }

     const formatTime = (timeInSeconds) => {
          const hours = Math.floor(timeInSeconds / 3600);
          const minutes = Math.floor((timeInSeconds % 3600) / 60);
          const seconds = timeInSeconds % 60;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
     };

     return (
          <div className='container-fluid'>
               <h1>Employee Details</h1>
               <div className='card'>
                    <div className='card-body'>
                         <p>Name: {employee.name}</p>
                         <p>Email: {employee.email}</p>
                         <p>Phone: {employee.phone}</p>
                         <p>Address: {employee.address}</p>
                         <div>
                              <h4>Select Client</h4>
                              <Form.Select aria-label="Default select example" onChange={(e) => setSelectedClient(e.target.value)} value={selectedClient}>
                                   <option>Select a client</option>
                                   {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                             {client.name}
                                        </option>
                                   ))}
                              </Form.Select>
                         </div>
                         <div>
                              <h2 className='my-2'>Timer: {formatTime(time)}</h2>
                              <button onClick={handleStart} className='btn btn-success'>Start</button>
                              <button onClick={handlePause} className='btn btn-warning ms-2'>{isPaused ? 'Resume' : 'Pause'}</button>
                              <button onClick={handleStop} className='btn  btn-danger ms-2'>Stop</button>
                         </div>
                         <button onClick={handleSubmit} className='btn btn-primary mt-3'>Submit</button>
                    </div>
               </div>

               <div className='mt-4'>
                    <h2>Attendance</h2>
                    <table className='table mt-4'>
                         <thead>
                              <tr>
                                   <th>Start Time</th>
                                   <th>End Time</th>
                                   <th>Start Location</th>
                                   <th>End Location</th>
                                   <th>Submit Location</th>
                                   <th>Total Time</th>
                              </tr>
                         </thead>
                         <tbody>
                              {attendanceRecords.map((record, index) => (
                                   <tr key={index}>
                                        <td>{new Date(record.startTime).toLocaleString()}</td>
                                        <td>{new Date(record.endTime).toLocaleString()}</td>
                                        <td>{record.startLocation}</td>
                                        <td>{record.endLocation}</td>
                                        <td>{record.submitLocation}</td>
                                        <td>{formatTime((new Date(record.endTime) - new Date(record.startTime)) / 1000)}</td>
                                   </tr>
                              ))}
                         </tbody>
                    </table>
               </div>
          </div>
     );
};

export default EmployeeDetails;
