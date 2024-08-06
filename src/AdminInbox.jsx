import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from "./firebase.config";
import AWS from 'aws-sdk';

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

     return (
          <div>
               <div className='container-fluid'>
                    <h1 className='bg-light p-2 text-center'>Inbox</h1>
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
