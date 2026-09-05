import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    lat: null,
    lon: null,
    locationName: '',
    state: '',
    district: '',
    city: '',
    loading: false,
    error: null,
    granted: false,
  });

  // Request location ONLY when user clicks a button — never auto-requests
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser.' }));
      return Promise.reject('Geolocation not supported');
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let locationName = '';
          let state = '';
          let district = '';
          let city = '';

          // Reverse geocode using Google Maps if available
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            try {
              const geocoder = new window.google.maps.Geocoder();
              const result = await new Promise((res, rej) => {
                geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                  if (status === 'OK' && results[0]) res(results[0]);
                  else rej(status);
                });
              });

              // Extract components
              const components = result.address_components || [];
              for (const c of components) {
                if (c.types.includes('locality')) city = c.long_name;
                if (c.types.includes('administrative_area_level_2')) district = c.long_name;
                if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              }
              locationName = city || district || result.formatted_address || '';
            } catch {
              locationName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
            }
          } else {
            locationName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
          }

          const newLocation = {
            lat: latitude,
            lon: longitude,
            locationName,
            state,
            district,
            city,
            loading: false,
            error: null,
            granted: true,
          };
          setLocation(newLocation);
          resolve(newLocation);
        },
        (err) => {
          const errorMsg =
            err.code === 1 ? 'Location permission denied. Please enable location access in your browser settings.' :
            err.code === 2 ? 'Location unavailable. Please try again.' :
            err.code === 3 ? 'Location request timed out. Please try again.' :
            'Could not get your location.';
          setLocation(prev => ({ ...prev, loading: false, error: errorMsg }));
          reject(errorMsg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation({
      lat: null, lon: null, locationName: '', state: '', district: '', city: '',
      loading: false, error: null, granted: false,
    });
  }, []);

  return (
    <LocationContext.Provider value={{ ...location, requestLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
