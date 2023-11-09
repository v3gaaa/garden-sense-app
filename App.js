import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function App() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [distancia, setDistancia] = useState(0);
  const [movimiento, setMovimiento] = useState(0);
  const [temperatura, setTemperatura] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState('Plant1'); // Elige un valor predeterminado


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

  const plants = ['Plant1', 'Plant2', 'Plant3', 'Plant4', 'Plant5'];

  return (
    <View style={styles.container}>
  <View style={styles.header}>
    <Text style={styles.headerText}>Home</Text>
  </View>

  <View style={styles.content}>
  <View style={styles.plantInfoContainer}>
      <View style={styles.menuIconContainer}>
        <ModalDropdown
          options={plants}
          onSelect={(index, value) => setSelectedPlant(value)}
          style={styles.menuIcon}
        >
          <Image source={require('./images/toggle.png')} style={styles.dropdownOptionImage} />
        </ModalDropdown>
      </View>
      <View style={styles.plantName}>
        <Text style={styles.headerText}>{selectedPlant}</Text>
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
    backgroundColor: '#94A684',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Quicksand',
    marginLeft: 10, // Ajusta el margen según tus necesidades
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
    padding: 10,
  },
  lineBorder: {
    flex: 1,
    height: 2,
    backgroundColor: 'black',
  },
  plantInfoContainer: {
    flexDirection: 'row', // Esto establece la dirección de fila
    alignItems: 'center', // Esto alinea los elementos verticalmente en el centro
  },
  
  // Estilos para el nombre de la planta
  plantName: {
    flex: 1,
  },

  // Estilos para el contenedor del menú del picker
  menuIconContainer: {
    paddingLeft: 10,
  },
});
