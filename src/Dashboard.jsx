import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase.config";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Modal } from "react-bootstrap";
import Swal from 'sweetalert2'


const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  console.log(selectedEmployeeIds, "<-- employe id");
  console.log(employees, "<-- employe");


  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const getUserData = async () => {
        try {
          const usersCollection = collection(db, "users");
          const q = query(usersCollection);
          const querySnapshot = await getDocs(q);
          const allUsers = [];

          for (const doc of querySnapshot.docs) {
            const userdata = doc.data();
            const userId = doc.id;
            const clientsCollection = collection(db, "clients");
            const clientQuery = query(clientsCollection, where("userId", "==", userId));
            const clientSnapshot = await getDocs(clientQuery);

            const clients = clientSnapshot.docs.map((clientDoc) => ({
              ...clientDoc.data(),
              id: clientDoc.id,
            }));

            allUsers.push({ ...userdata, id: userId, clients });
          }

          setUsers(allUsers);
        } catch (error) {
          console.error("Error", error);
        }
      };

      getUserData();
    }
  }, [user]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("role", "array-contains", "employee"));
        const querySnapshot = await getDocs(q);
        const employeeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name
        }));
        setEmployees(employeeList);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  const renderEmployeeDropdown = () => {
    const handleSelectChange = (e) => {
      const options = Array.from(e.target.selectedOptions, option => option.value);
      setSelectedEmployeeIds(options);
    };

    return (
      <div className="mb-3">
        <label htmlFor="employee">Select Employees</label>
        <select
          id="employee"
          className="form-control"
          multiple
          onChange={handleSelectChange}
          value={selectedEmployeeIds}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
    );
  };


  const openUserModal = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const openClientModal = (client) => {
    setEditingClient(client);
    setCurrentClientId(client.id);
    setShowClientModal(true);
  };

  const closeClientModal = () => {
    setShowClientModal(false);
    setEditingClient(null);
    setCurrentClientId(null);
  };


  const handleLogout = () => {
    auth.signOut();
    navigate("/");
    console.log("Logged out");
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      address: "",
      active: true,
      fcmtoken: [],
      group: [],
      phone: "",
      role: ["client"],
      sitelocation: "",
      siteaddress: "",
      sitename: "",
      poc: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email address").required("Email is required"),
      address: Yup.string().required("Address is required"),
      phone: Yup.string().required("Phone is required"),
      sitelocation: Yup.string().required("Site location is required"),
      siteaddress: Yup.string().required("Site address is required"),
      sitename: Yup.string().required("Site name is required"),
      poc: Yup.string().required("POC is required"),
    }),
    onSubmit: async (values) => {
      try {
        const userDocRef = await addDoc(collection(db, "users"), {
          name: values.name,
          email: values.email,
          address: values.address,
          active: values.active,
          fcmtoken: values.fcmtoken,
          group: values.group,
          phone: values.phone,
          role: values.role,
        });

        await addDoc(collection(db, "clients"), {
          userId: userDocRef.id,
          sitelocation: values.sitelocation,
          siteaddress: values.siteaddress,
          sitename: values.sitename,
          users: selectedEmployeeIds,
          createdat: new Date().toISOString(),
          poc: values.poc,
        });

        setUsers([
          ...users,
          {
            id: userDocRef.id,
            name: values.name,
            email: values.email,
            address: values.address,
            phone: values.phone,
            active: values.active,
            clients: [{
              userId: userDocRef.id,
              sitelocation: values.sitelocation,
              siteaddress: values.siteaddress,
              sitename: values.sitename,
              poc: values.poc,
              createdat: new Date().toISOString(),
              users: selectedEmployeeIds
            }],
          },
        ]);

        Swal.fire({
          position: "middle",
          icon: "success",
          title: "client data added successfully!",
          showConfirmButton: false,
          timer: 1500
        });
        formik.resetForm();
        selectedEmployeeIds([]);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    },
  });

  const handleUpdateUser = async () => {
    try {
      const userDocRef = doc(db, "users", editingUser.id);
      await updateDoc(userDocRef, {
        name: editingUser.name,
        email: editingUser.email,
        address: editingUser.address,
        phone: editingUser.phone,
        active: editingUser.active,
      });

      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...editingUser }
          : user
      ));

      setEditingUser(null);
      setShowUserModal(false);

      Swal.fire({
        position: "middle",
        icon: "success",
        title: "User updated successfully!",
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleUpdateClient = async () => {
    try {
      const clientDocRef = doc(db, "clients", currentClientId);
      await updateDoc(clientDocRef, {
        sitelocation: editingClient.sitelocation,
        siteaddress: editingClient.siteaddress,
        sitename: editingClient.sitename,
        poc: editingClient.poc,
      });

      setUsers(users.map(user => ({
        ...user,
        clients: user.clients.map(client =>
          client.id === currentClientId
            ? { ...client, ...editingClient }
            : client
        )
      })));

      setEditingClient(null);
      setCurrentClientId(null);
      setShowClientModal(false);

      Swal.fire({
        position: "middle",
        icon: "success",
        title: "Client updated successfully!",
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };


  const handleDeleteUser = async (userId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure you want to delete?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      });

      if (result.isConfirmed) {
        const userDocRef = doc(db, "users", userId);
        await deleteDoc(userDocRef);

        const clientsCollection = collection(db, "clients");
        const clientQuery = query(clientsCollection, where("userId", "==", userId));
        const clientSnapshot = await getDocs(clientQuery);
        clientSnapshot.docs.forEach(async (clientDoc) => {
          await deleteDoc(doc(clientsCollection, clientDoc.id));
        });

        setUsers(users.filter(user => user.id !== userId));

        await Swal.fire({
          title: "Deleted!",
          text: "The user and associated clients have been deleted.",
          icon: "success"
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      await Swal.fire({
        title: "Error!",
        text: "There was an issue deleting the user. Please try again.",
        icon: "error"
      });
    }
  };

  const handleDeleteClient = async (clientId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure you want to delete?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      });

      if (result.isConfirmed) {
        const clientDocRef = doc(db, "clients", clientId);
        await deleteDoc(clientDocRef);

        setUsers(users.map(user => ({
          ...user,
          clients: user.clients.filter(client => client.id !== clientId),
        })));

        await Swal.fire({
          title: "Deleted!",
          text: "The client has been deleted.",
          icon: "success"
        });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      await Swal.fire({
        title: "Error!",
        text: "There was an issue deleting the client. Please try again.",
        icon: "error"
      });
    }
  };

  const clientData = users.filter(user => user?.role?.includes('client'));

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <>
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
          <h2 className="mt-3 text-center">Add Client</h2>
          <div className="d-flex w-100 justify-content-center">

            <div className="form-section" style={{ width: '70%' }}>
              <form onSubmit={formik.handleSubmit}>
                <div className="py-1">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    className="form-control"
                    name="name"
                    type="text"
                    onChange={formik.handleChange}
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
                    value={formik.values.phone}
                  />
                  {formik.touched.phone && formik.errors.phone ? (
                    <small className="text-danger">{formik.errors.phone}</small>
                  ) : null}
                </div>

                <div className="py-1">
                  <label htmlFor="sitelocation">Site Location</label>
                  <input
                    id="sitelocation"
                    className="form-control"
                    name="sitelocation"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.sitelocation}
                  />
                  {formik.touched.sitelocation && formik.errors.sitelocation ? (
                    <small className="text-danger">{formik.errors.sitelocation}</small>
                  ) : null}
                </div>

                <div className="py-1">
                  <label htmlFor="siteaddress">Site Address</label>
                  <input
                    id="siteaddress"
                    className="form-control"
                    name="siteaddress"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.siteaddress}
                  />
                  {formik.touched.siteaddress && formik.errors.siteaddress ? (
                    <small className="text-danger">{formik.errors.siteaddress}</small>
                  ) : null}
                </div>

                <div className="py-1">
                  <label htmlFor="sitename">Site Name</label>
                  <input
                    id="sitename"
                    className="form-control"
                    name="sitename"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.sitename}
                  />
                  {formik.touched.sitename && formik.errors.sitename ? (
                    <small className="text-danger">{formik.errors.sitename}</small>
                  ) : null}
                </div>

                <div className="py-1">
                  <label htmlFor="poc">POC</label>
                  <input
                    id="poc"
                    className="form-control"
                    name="poc"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.poc}
                  />
                  {formik.touched.poc && formik.errors.poc ? (
                    <small className="text-danger">{formik.errors.poc}</small>
                  ) : null}
                </div>

                {renderEmployeeDropdown()}

                <button type="submit" className="btn btn-primary w-25 my-3">Submit</button>
              </form>
            </div>
          </div>

          <div className="container-fluid">
            <h2>Users and Clients</h2>
            {clientData.length > 0 ? (
              <div className="my-3 d-flex gap-4 flex-wrap">
                {clientData.map((user) => (
                  <div key={user.id} className="card mt-3">
                    <div className="card-body">
                      <h4>Users</h4>
                      <p>Name: {user.name}</p>
                      <p>Email: {user.email}</p>
                      <p>Address: {user.address}</p>
                      <p>Phone: {user.phone}</p>
                      <button className="btn btn-success" onClick={() => openUserModal(user)}>Edit User</button>
                      <button className="btn btn-danger ms-3" onClick={() => handleDeleteUser(user.id)}>Delete User</button>
                      <h4 className="pt-3">Clients</h4>
                      <div>
                        {user.clients.map((client) => (
                          <div key={client.id}>
                            <p>Site Location: {client.sitelocation}</p>
                            <p>Site Address: {client.siteaddress}</p>
                            <p>Site Name: {client.sitename}</p>
                            <p>POC: {client.poc}</p>
                            <p>CreatedAt: {client.createdat}</p>
                            <button className="btn btn-success" onClick={() => openClientModal(client)}>Edit Client</button>
                            <button className="btn btn-danger ms-3" onClick={() => handleDeleteClient(client.id)}>Delete Client</button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <p>No users found</p>
            )}
          </div>


          <Modal show={showUserModal} onHide={closeUserModal}>
            <Modal.Header closeButton>
              <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                <div className="mb-3">
                  <label htmlFor="editName">Name</label>
                  <input
                    id="editName"
                    className="form-control"
                    type="text"
                    value={editingUser?.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editEmail">Email</label>
                  <input
                    id="editEmail"
                    className="form-control"
                    type="text"
                    value={editingUser?.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editAddress">Address</label>
                  <input
                    id="editAddress"
                    className="form-control"
                    type="text"
                    value={editingUser?.address || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editPhone">Phone</label>
                  <input
                    id="editPhone"
                    className="form-control"
                    type="text"
                    value={editingUser?.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Update User
                </button>
                <button className="btn btn-danger ms-3" onClick={closeUserModal}>Cancel</button>

              </form>
            </Modal.Body>
          </Modal>

          <Modal show={showClientModal} onHide={closeClientModal}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Client</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateClient(); }}>
                <div className="mb-3">
                  <label htmlFor="editSitelocation">Site Location</label>
                  <input
                    id="editSitelocation"
                    className="form-control"
                    type="text"
                    value={editingClient?.sitelocation || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, sitelocation: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSiteaddress">Site Address</label>
                  <input
                    id="editSiteaddress"
                    className="form-control"
                    type="text"
                    value={editingClient?.siteaddress || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, siteaddress: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSitename">Site Name</label>
                  <input
                    id="editSitename"
                    className="form-control"
                    type="text"
                    value={editingClient?.sitename || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, sitename: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editPoc">POC</label>
                  <input
                    id="editPoc"
                    className="form-control"
                    type="text"
                    value={editingClient?.poc || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, poc: e.target.value })}
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Update Client
                </button>
                <button className="btn btn-danger ms-3" onClick={closeClientModal}>Cancel</button>
              </form>
            </Modal.Body>
          </Modal>

        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};

export default Dashboard;