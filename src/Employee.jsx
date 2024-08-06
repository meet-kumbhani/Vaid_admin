import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase.config';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';

const Employee = () => {
     const navigate = useNavigate();
     const [employees, setEmployees] = useState([]);
     const [selectedEmployee, setSelectedEmployee] = useState(null);
     const [showModal, setShowModal] = useState(false);

     const handleLogout = () => {
          auth.signOut();
          navigate("/");
          console.log("Logged out");
     };

     const initialValues = {
          name: '',
          email: '',
          phone: '',
          address: '',
     };

     const validationSchema = Yup.object({
          name: Yup.string().required('Name is required'),
          email: Yup.string().email('Invalid email format').required('Email is required'),
          phone: Yup.string().required('Phone number is required'),
          address: Yup.string().required('Address is required'),
     });

     const onSubmit = async (values, { resetForm }) => {
          try {
               if (selectedEmployee) {
                    const docRef = doc(db, 'users', selectedEmployee.id);
                    await updateDoc(docRef, values);
                    setSelectedEmployee(null);
                    setShowModal(false);
               } else {
                    await addDoc(collection(db, 'users'), {
                         ...values,
                         active: true,
                         fcmtoken: [],
                         group: [],
                         role: ['employee']
                    });
               }
               resetForm();
               Swal.fire({
                    position: "middle",
                    icon: "success",
                    title: selectedEmployee ? "Your Data is Updated.." : "Your work has been saved",
                    showConfirmButton: false,
                    timer: 1500
               });

               fetchEmployees();
          } catch (error) {
               console.error('Error adding document: ', error);
               alert('Failed to add/update employee');
          }
     };

     const fetchEmployees = async () => {
          try {
               const q = query(collection(db, 'users'), where("role", "array-contains", "employee"));
               const querySnapshot = await getDocs(q);
               const employeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
               setEmployees(employeesList);
          } catch (error) {
               console.error('Error fetching employees: ', error);
          }
     };

     const handleEdit = (employee) => {
          setSelectedEmployee(employee);
          setShowModal(true);
     };

     const handleDelete = async (id) => {
          Swal.fire({
               title: "Are you sure?",
               text: "You won't be able to revert this!",
               icon: "warning",
               showCancelButton: true,
               confirmButtonColor: "#3085d6",
               cancelButtonColor: "#d33",
               confirmButtonText: "Yes, delete it!",
               cancelButtonText: "Cancel"
          }).then(async (result) => {
               if (result.isConfirmed) {
                    try {
                         await deleteDoc(doc(db, 'users', id));
                         Swal.fire({
                              title: "Deleted!",
                              text: "The employee has been deleted.",
                              icon: "success"
                         });
                         fetchEmployees();
                    } catch (error) {
                         console.error('Error deleting document: ', error);
                         Swal.fire({
                              title: "Error!",
                              text: "Failed to delete the employee.",
                              icon: "error"
                         });
                    }
               }
          });
     };


     useEffect(() => {
          fetchEmployees();
     }, []);

     return (
          <div>
               <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                         <a className="navbar-brand" href="/dashboard">Dashboard</a>
                         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                              <span className="navbar-toggler-icon"></span>
                         </button>
                         <div className="collapse navbar-collapse " id="navbarSupportedContent">
                              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/dashboard"}>Client</Link>
                                   </li>
                                   <li className="nav-item">
                                        <Link className="nav-link active" aria-current="page" to={"/employee"}>Employee</Link>
                                   </li>
                              </ul>
                              <form className="d-flex ms-auto">
                                   <button onClick={handleLogout} className="btn btn-danger">Log-Out</button>
                              </form>
                         </div>
                    </div>
               </nav>

               <div className="container mt-4">

                    <h2 className='text-center'>Add Employee</h2>

                    <Formik
                         initialValues={initialValues}
                         validationSchema={validationSchema}
                         onSubmit={onSubmit}
                    >
                         {(formik) => (
                              <form onSubmit={formik.handleSubmit}>
                                   <div className="py-1">
                                        <label htmlFor="name">Name</label>
                                        <input
                                             id="name"
                                             className="form-control"
                                             name="name"
                                             type="text"
                                             onChange={formik.handleChange}
                                             onBlur={formik.handleBlur}
                                             value={formik.values.name}
                                        />
                                        {formik.touched.name && formik.errors.name ? (
                                             <small className="text-danger">{formik.errors.name}</small>
                                        ) : null}
                                   </div>

                                   <div className="py-1">
                                        <label htmlFor="email">Email</label>
                                        <input
                                             id="email"
                                             className="form-control"
                                             name="email"
                                             type="email"
                                             onChange={formik.handleChange}
                                             onBlur={formik.handleBlur}
                                             value={formik.values.email}
                                        />
                                        {formik.touched.email && formik.errors.email ? (
                                             <small className="text-danger">{formik.errors.email}</small>
                                        ) : null}
                                   </div>

                                   <div className="py-1">
                                        <label htmlFor="address">Address</label>
                                        <input
                                             id="address"
                                             className="form-control"
                                             name="address"
                                             type="text"
                                             onChange={formik.handleChange}
                                             onBlur={formik.handleBlur}
                                             value={formik.values.address}
                                        />
                                        {formik.touched.address && formik.errors.address ? (
                                             <small className="text-danger">{formik.errors.address}</small>
                                        ) : null}
                                   </div>

                                   <div className="py-1">
                                        <label htmlFor="phone">Phone</label>
                                        <input
                                             id="phone"
                                             className="form-control"
                                             name="phone"
                                             type="text"
                                             onChange={formik.handleChange}
                                             onBlur={formik.handleBlur}
                                             value={formik.values.phone}
                                        />
                                        {formik.touched.phone && formik.errors.phone ? (
                                             <small className="text-danger">{formik.errors.phone}</small>
                                        ) : null}
                                   </div>
                                   <button type="submit" className="btn btn-primary w-25 my-3">Submit</button>
                              </form>
                         )}
                    </Formik>

                    <div className="my-4">
                         <h2>Employee List</h2>
                         <div className='d-flex gap-3'>
                              {employees.map(employee => (
                                   <div key={employee.id} className="card mt-3" style={{ width: "18rem" }}>
                                        <div className='card-body'>
                                             <p>Name: {employee.name}</p>
                                             <p>Email: {employee.email}</p>
                                             <p>Phone: {employee.phone}</p>
                                             <p>Address: {employee.address}</p>
                                             <div className='d-flex'>
                                                  <button onClick={() => handleEdit(employee)} className='btn btn-success'>Edit</button>
                                                  <button onClick={() => handleDelete(employee.id)} className='ms-3 btn btn-danger'>Delete</button>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>


               {selectedEmployee && (
                    <Modal show={showModal} onHide={() => setShowModal(false)}>
                         <Modal.Header closeButton>
                              <Modal.Title>Edit Employee</Modal.Title>
                         </Modal.Header>
                         <Modal.Body>
                              <Formik
                                   initialValues={selectedEmployee}
                                   validationSchema={validationSchema}
                                   onSubmit={onSubmit}
                              >
                                   {(formik) => (
                                        <form onSubmit={formik.handleSubmit}>
                                             <div className="py-1">
                                                  <label htmlFor="name">Name</label>
                                                  <input
                                                       id="name"
                                                       className="form-control"
                                                       name="name"
                                                       type="text"
                                                       onChange={formik.handleChange}
                                                       onBlur={formik.handleBlur}
                                                       value={formik.values.name}
                                                  />
                                                  {formik.touched.name && formik.errors.name ? (
                                                       <small className="text-danger">{formik.errors.name}</small>
                                                  ) : null}
                                             </div>

                                             <div className="py-1">
                                                  <label htmlFor="email">Email</label>
                                                  <input
                                                       id="email"
                                                       className="form-control"
                                                       name="email"
                                                       type="email"
                                                       onChange={formik.handleChange}
                                                       onBlur={formik.handleBlur}
                                                       value={formik.values.email}
                                                  />
                                                  {formik.touched.email && formik.errors.email ? (
                                                       <small className="text-danger">{formik.errors.email}</small>
                                                  ) : null}
                                             </div>

                                             <div className="py-1">
                                                  <label htmlFor="address">Address</label>
                                                  <input
                                                       id="address"
                                                       className="form-control"
                                                       name="address"
                                                       type="text"
                                                       onChange={formik.handleChange}
                                                       onBlur={formik.handleBlur}
                                                       value={formik.values.address}
                                                  />
                                                  {formik.touched.address && formik.errors.address ? (
                                                       <small className="text-danger">{formik.errors.address}</small>
                                                  ) : null}
                                             </div>

                                             <div className="py-1">
                                                  <label htmlFor="phone">Phone</label>
                                                  <input
                                                       id="phone"
                                                       className="form-control"
                                                       name="phone"
                                                       type="text"
                                                       onChange={formik.handleChange}
                                                       onBlur={formik.handleBlur}
                                                       value={formik.values.phone}
                                                  />
                                                  {formik.touched.phone && formik.errors.phone ? (
                                                       <small className="text-danger">{formik.errors.phone}</small>
                                                  ) : null}
                                             </div>
                                             <button type="submit" className="btn btn-primary w-25 my-3">Update</button>
                                             <button className="btn btn-danger w-25 my-3 ms-3" onClick={() => setShowModal(false)}>Cancel</button>
                                        </form>
                                   )}
                              </Formik>
                         </Modal.Body>
                    </Modal>
               )}

          </div>
     );
};

export default Employee;
