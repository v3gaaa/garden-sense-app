import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import axios from 'axios';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  fas,
  faTriangleExclamation,
  faShield,
  faTemperatureHalf,
  faDroplet,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

// Inicializa Font Awesome
library.add(fas, faDroplet, faTriangleExclamation, faShield, faTemperatureHalf);

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAt5_BrZyNPK2hoLvBXMDjeyAY9pOmNqsY",
  authDomain: "gardensense-cfe37.firebaseapp.com",
  databaseURL: "https://gardensense-cfe37-default-rtdb.firebaseio.com",
  projectId: "gardensense-cfe37",
  storageBucket: "gardensense-cfe37.appspot.com",
  messagingSenderId: "949510113189",
  appId: "1:949510113189:web:94c542b2d64df8fc2c4a4c",
  measurementId: "G-0TR1T5V5ZP"
};

export default function App() {
  // Estados para almacenar los valores de sensores y la planta seleccionada
  const [humedad, setHumedad] = useState(0);
  const [movimiento, setMovimiento] = useState(0);
  const [temperatura, setTemperatura] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState('Tomate'); // Valor predeterminado
  const [plantDetails, setPlantDetails] = useState({});
  const [plantNames, setPlantNames] = useState([]);

  // Inicializa la aplicación de Firebase
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getDatabase(firebaseApp);
  const sensoresRef = ref(db, 'sensores');

  useEffect(() => {
    // Escucha cambios en la base de datos de Firebase y actualiza los estados
    const handleDatabaseChange = (snapshot) => {
      const data = snapshot.val();
      setHumedad(data.humedad);
      setMovimiento(data.movimiento);
      setTemperatura(data.temperatura);
    };

    onValue(sensoresRef, handleDatabaseChange);

    // Realiza la solicitud a la API al cargar la planta seleccionada
    getPlantDetails(selectedPlant);

    // Realiza solicitud a la API para obtener nombres de plantas
    fetchPlantNames();

    return () => {
      // Limpiar el listener cuando el componente se desmonte
      off(sensoresRef, 'value', handleDatabaseChange);
    };
  }, [selectedPlant]);  // Agrega selectedPlant como dependencia

  const fetchPlantNames = async () => {
    try {
      const response = await fetch("https://garden-sense-app-production.up.railway.app/plantas/nombres");
      const data = await response.json();
      setPlantNames(data);
    } catch (error) {
      console.error("Error al obtener nombres de plantas:", error);
    }
  };

  const getPlantDetails = async (plantName) => {
    try {
      const response = await axios.get(`https://garden-sense-app-production.up.railway.app/plantas/${plantName}`);
      setPlantDetails(response.data);
    } catch (error) {
      console.error('Error al obtener detalles de la planta:', error);
    }
  };

  const handlePlantChange = (plantName) => {
    setSelectedPlant(plantName);
    sendPlantDetailsToAPI(plantName);
  };

  const sendPlantDetailsToAPI = (plantName) => {
    axios.post('https://garden-sense-app-production.up.railway.app/plantas/seleccionada', {
      nombre: plantName,
      minhum: plantDetails.minhum,
      maxhum: plantDetails.maxhum,
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error('Error al actualizar detalles de planta:', error);
    });
  };

  const regarPlanta = () => {
    axios.post('https://garden-sense-app-production.up.railway.app/riego/set', {
      riego: 1,
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error('Error al actualizar estado del riego', error);
    });
  };

  
  return (
    <View style={styles.container}>
      {/* Encabezado de la aplicación */}
      <View style={styles.header}>
        <View style={styles.options} />
        <View style={styles.home}>
          <Text style={styles.headerText}>Home</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Información de la planta seleccionada */}
        <View style={styles.plantInfoContainer}>
          <View style={styles.menuIconContainer}>
            {/* Selector de planta desplegable */}
            <ModalDropdown
              options={plantNames}
              initialScrollIndex={0}
              onSelect={(index, value) => handlePlantChange(value)}
              dropdownStyle={styles.dropdown}
            >
              <Image source={require('./images/toggle.png')} style={styles.dropdownOptionImage} />
            </ModalDropdown>
          </View>
          <View style={styles.plantName}>
            <Text style={styles.Text}>{selectedPlant}</Text>
          </View>
        </View>

        <View style={styles.rectangleContainer}>
          {/* Línea de separación */}
          <View style={styles.line}>
            <View style={styles.lineBorder}></View>
          </View>

          {/* Muestra la humedad del sensor */}
          <View style={styles.rectangle}>
            <FontAwesomeIcon
              icon={['fas', 'droplet']}
              size={30}
              color={humedad > plantDetails.maxhum ? 'navy' : (humedad < plantDetails.minhum ? 'yellow' : '#4e76bc')}
              style={styles.icon}
            />
            <Text style={[styles.rectangleText, humedad > plantDetails.maxhum ? { color: 'navy' } : (humedad < plantDetails.minhum ? { color: 'yellow' } : null)]}>
              {humedad > plantDetails.maxhum ? 'Mucha agua' : (humedad < plantDetails.minhum ? 'Falta regar' : 'Todo bien')}
            </Text>
          </View>

          {/* Muestra el estado de movimiento del sensor */}
          <View style={styles.rectangle}>
            <FontAwesomeIcon
              icon={['fas', movimiento === 1 ? 'triangle-exclamation' : 'shield']}
              size={30}
              color={movimiento === 1 ? '#DA0202' : '#606c38'}
              style={styles.icon}
            />
            <Text style={[styles.rectangleText, movimiento === 1 ? styles.warningText : null]}>
              {movimiento === 0 ? 'Segura' : '¡Cuidado!'}
            </Text>
          </View>

          {/* Muestra la temperatura del sensor */}
          <View style={styles.rectangle}>
            <FontAwesomeIcon
              icon={['fas', 'temperature-half']}
              size={30}
              color={temperatura > plantDetails.maxtemp ? 'orange' : (temperatura < plantDetails.mintemp ? 'skyblue' : '#C8C1C1')}
              style={styles.icon}
            />
            <Text style={[styles.rectangleText, temperatura > plantDetails.maxtemp ? { color: 'orange' } : (temperatura < plantDetails.mintemp ? { color: 'skyblue' } : null)]}>
              {`${temperatura} °C`}
            </Text>
          </View>
        </View>

        {/* Botón para regar la planta*/}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonTextContainer}>
            <Button
              onPress={regarPlanta}
              title="Regar Planta"
              color="#94A684"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4E4D0',
  },
  header: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  home: {
    paddingVertical: 27,
    backgroundColor: "#94A684",
    flex: 1,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
  },
  options: {
    marginTop: 10,
    marginLeft: 20,
    marginRight: 160,
  },
  pickerContainer: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rectangleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rectangle: {
    width: 300,
    height: 100,
    backgroundColor: '#B3A492',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
  rectangleText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineBorder: {
    flex: 1,
    height: 2,
    backgroundColor: '#94A684',
  },
  plantInfoContainer: {
    flexDirection: 'row', // Esto establece la dirección de fila
    alignItems: 'center', // Esto alinea los elementos verticalmente en el centro
  },
  // Estilos para el nombre de la planta
  plantName: {
    flex: 1,
    marginLeft: 10,
  },
  Text: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Estilos para el contenedor del menú del picker
  menuIconContainer: {
    paddingLeft: 10,
  },
  // Estilos para el menú desplegable
  dropdownOptionImage: {
    width: 30,
    height: 35,
  },
  dropdown: {
    width: 100,
    height: 100,
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 3,
    backgroundColor: '#94A684',
  },
  buttonContainer: {
    borderRadius: 20, // Hace que el botón sea circular
    borderWidth: 1,  // Añade un borde
    borderColor: '#94A684',  // Color del borde
    overflow: 'hidden', // Asegura que el contenido no sobresalga del contenedor
  },
  buttonTextContainer: {
    paddingHorizontal: 20, // Ajusta el espacio alrededor del texto
    paddingVertical: 10,
  },
});
