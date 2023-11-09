import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Puedes cambiar el ícono según tus preferencias

export default function App() {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.menuIcon}>
            <Icon name={isMenuOpen ? 'close' : 'bars'} size={30} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.headerText}>Home</Text>
      </View>

      {isMenuOpen && (
        // Agregar aquí el contenido del menú que se mostrará al hacer clic en el ícono de menú
        <View style={styles.menu}>
          {/* Puedes agregar elementos de menú aquí */}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.rectangleContainer}>
          <View style={styles.line}>
            <View style={styles.lineBorder}></View>
          </View>

          <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>34.5</Text>
          </View>

          <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>34.5</Text>
          </View>

          <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>34.5</Text>
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
  menuIcon: {
    marginLeft: 10,
  },
  menu: {
    // Estilos del menú, puedes ajustarlos según tus necesidades
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
  // Otros estilos...
});
