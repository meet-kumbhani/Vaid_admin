import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase.config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Evidences = () => {
     const [clients, setClients] = useState([]);
     console.log(clients, "<-- data");
     const navigate = useNavigate();


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

     const handleLogout = () => {
          auth.signOut();
          navigate("/");
          console.log("Logged out");
     };

     return (
          <div className='container-fluid'>
               <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                         <a className="navbar-brand" href="#">Dashboard</a>
                         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                              <span className="navbar-toggler-icon"></span>
                         </button>
                         <div className="collapse navbar-collapse " id="navbarSupportedContent">
                              <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/dashboard"}>Client</Link>
                                   </li>
                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/employee"}>employee</Link>
                                   </li>
                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/evidence"}>evidence</Link>
                                   </li>
                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/inbox"}>inbox</Link>
                                   </li>
                              </ul>
                              <form className="d-flex ms-auto">
                                   <button onClick={handleLogout} className="btn btn-danger">Log-Out</button>
                              </form>
                         </div>
                    </div>
               </nav>

               <h2>Clients</h2>


               {clients.length > 0 ? (
                    <>
                         {clients.map(client => (
                              <Link className='nav-link card mt-3' to={`/evidencedetails/${client.id}`} key={client.id}>
                                   <div className='card-body'>
                                        <div key={client.id}>
                                             <strong>Name:</strong> {client.name}<br />
                                             <strong>Email:</strong> {client.email}<br />
                                        </div>
                                   </div>
                              </Link>
                         ))}
                    </>
               ) : (
                    <p>No clients found.</p>
               )}
          </div>

     );
};

export default Evidences;
