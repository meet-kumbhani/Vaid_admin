import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from "./firebase.config";
import AWS from 'aws-sdk';
import { Link, useNavigate } from 'react-router-dom';

AWS.config.update({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const AdminInbox = () => {
     const [message, setMessage] = useState('');
     const [files, setFiles] = useState([]);
     const [uploading, setUploading] = useState(false);

     const navigate = useNavigate()

     const handleFileChange = (event) => {
          setFiles(event.target.files);
     };

     const uploadFileToS3 = (file) => {
          const params = {
               Bucket: process.env.AWS_BUCKET,
               Key: `inbox/${file.name}`,
               Body: file,
               ContentType: file.type,
          };

          return s3.upload(params).promise();
     };

     const handleSubmit = async (event) => {
          event.preventDefault();
          setUploading(true);

          const fileUrls = [];

          for (const file of files) {
               try {
                    const uploadResult = await uploadFileToS3(file);
                    fileUrls.push(uploadResult.Location);
               } catch (error) {
                    console.error(`Error uploading file ${file.name}: `, error);
               }
          }

          try {
               await addDoc(collection(db, 'inbox'), {
                    title: message,
                    createdAt: Timestamp.fromDate(new Date()),
                    attachments: fileUrls,
               });

               setMessage('');
               setFiles([]);
               alert('Data Store');
          } catch (error) {
               console.error('Error adding document: ', error);
          } finally {
               setUploading(false);
          }
     };

     const handleLogout = () => {
          auth.signOut();
          navigate("/");
          console.log("Logged out");
     };


     return (
          <div>
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
                    <h1 className='p-2 text-center'>Inbox</h1>
                    <Form onSubmit={handleSubmit}>
                         <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                              <Form.Label>Enter Something</Form.Label>
                              <Form.Control
                                   as="textarea"
                                   rows={3}
                                   value={message}
                                   onChange={(e) => setMessage(e.target.value)}
                              />
                         </Form.Group>
                         <Form.Group className="mb-3">
                              <Form.Label>Select files:</Form.Label>
                              <Form.Control
                                   type="file"
                                   onChange={handleFileChange}
                                   multiple
                              />
                         </Form.Group>
                         <Button variant="primary" type="submit" disabled={uploading}>
                              {uploading ? 'Uploading...' : 'Submit'}
                         </Button>
                    </Form>
               </div>
          </div>
     );
};

export default AdminInbox;
