import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.config';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const EvidenceDetails = () => {
     const { id } = useParams();
     const [evidence, setEvidence] = useState(null);
     const [locations, setLocations] = useState({});
     const [selectedLocation, setSelectedLocation] = useState(null);
     const mapRef = useRef(null);

     const GOOGLE_MAPS_API_KEY = 'AIzaSyBHyngtjTulkJ96GKevrg7jpxwypD1Kx-k';

     useEffect(() => {
          const getEvidence = () => {
               const evidenceCollection = collection(db, "evidence");
               const unsubscribeEvidence = onSnapshot(evidenceCollection, (snapshot) => {
                    const updatedEvidenceData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    const matchingEvidence = updatedEvidenceData.find(e => e.userId === id);
                    setEvidence(matchingEvidence);
                    if (matchingEvidence && matchingEvidence.evidence) {
                         fetchLocations(matchingEvidence.evidence);
                    }
               });
               return () => unsubscribeEvidence();
          };
          getEvidence();
     }, [id]);

     const fetchLocations = async (attachments) => {
          const newLocations = {};
          for (const attachment of attachments) {
               const locationName = await getLocationName(attachment.lat, attachment.lng);
               newLocations[`${attachment.lat},${attachment.lng}`] = locationName;
          }
          setLocations(newLocations);
     };

     const getLocationName = async (lat, lng) => {
          try {
               const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
               if (response.data.status === 'OK') {
                    const addressComponents = response.data.results[0].address_components;
                    let city = '';
                    let state = '';

                    for (const component of addressComponents) {
                         if (component.types.includes('locality')) {
                              city = component.long_name;
                         }
                         if (component.types.includes('administrative_area_level_1')) {
                              state = component.long_name;
                         }
                    }

                    return `${city}, ${state}`;
               } else {
                    return 'Unknown location';
               }
          } catch (error) {
               console.error('Error fetching location name:', error);
               return 'Error fetching location';
          }
     };

     const handleImageClick = (lat, lng) => {
          setSelectedLocation({ lat, lng });
          if (mapRef.current) {
               mapRef.current.setView([lat, lng], 13); // Adjust zoom level as needed
          }
     };

     return (
          <div className='container-fluid'>
               <h1>Evidence Details</h1>
               {evidence ? (
                    <div>
                         <div style={{ display: 'flex', gap: '20px' }}>
                              <div style={{ flex: '1' }}>
                                   {evidence.evidence.map((attachment) => (
                                        <div key={attachment.url} onClick={() => handleImageClick(attachment.lat, attachment.lng)} style={{ cursor: 'pointer' }}>
                                             <img src={attachment.url} alt="" width="100%" style={{ marginBottom: '10px' }} />
                                             <p style={{ margin: 0 }}>
                                                  <strong>Location:-</strong> {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                             </p>
                                             <p><strong>Message:- </strong>{evidence.message}</p>
                                        </div>
                                   ))}
                              </div>
                              <div style={{ flex: '2' }}>
                                   <MapContainer center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [evidence.evidence[0].lat, evidence.evidence[0].lng]} zoom={13} style={{ height: '500px', width: '100%' }} ref={mapRef}>
                                        <TileLayer
                                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {evidence.evidence.map((attachment) => (
                                             <Marker key={`${attachment.lat},${attachment.lng}`} position={[attachment.lat, attachment.lng]}>
                                                  <Popup>
                                                       <img src={attachment.url} alt="" width={200} /><br />
                                                       Latitude: {attachment.lat}<br />
                                                       Longitude: {attachment.lng}<br />
                                                       Location: {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                                  </Popup>
                                             </Marker>
                                        ))}
                                   </MapContainer>
                              </div>
                         </div>
                    </div>
               ) : (
                    <p>No matching evidence found.</p>
               )}
          </div>
     );
};

export default EvidenceDetails;
