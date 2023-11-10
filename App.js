import React, { useState, useEffect } from 'react';
import { AppLoading } from 'expo';
import { StyleSheet, Text, View, Image} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';


export default function App() {

  const [distancia, setDistancia] = useState(0);
  const [movimiento, setMovimiento] = useState(0);
  const [temperatura, setTemperatura] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState('Plant 1'); // Elige un valor predeterminado


  // Configura la conexión a Firebase y escucha cambios en tiempo real
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

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getDatabase(firebaseApp);
  const sensoresRef = ref(db, 'sensores');

  useEffect(() => {
    onValue(sensoresRef, (snapshot) => {
      const data = snapshot.val();
      setDistancia(data.distancia);
      setMovimiento(data.movimiento);
      setTemperatura(data.temperatura);
    });
  }, []);

  const plants = ['Plant 1', 'Plant 2', 'Plant 3', 'Plant 4', 'Plant 5'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./images/options.png')} style={styles.options} />

        <View style={styles.home}>
          <Text style={styles.headerText}>Home</Text>
        </View>
      </View>

      <View style={styles.content}>
      <View style={styles.plantInfoContainer}>
          <View style={styles.menuIconContainer}>
            <ModalDropdown
              options={plants}
              onSelect={(index, value) => setSelectedPlant(value)}
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
          <View style={styles.line}>
            <View style={styles.lineBorder}></View>
          </View>

          <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>{distancia}</Text>
          </View>

          <View style={styles.rectangle}>
            <Text style={[styles.rectangleText, movimiento === 1 ? { color: 'red' } : null]}>
              {movimiento === 0 ? 'A salvo' : '¡Cuidado!'}
            </Text>
          </View>

          <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>{temperatura}</Text>
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
  // Estilos para el menú
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
});
