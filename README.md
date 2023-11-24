# GardenSense

GardenSense is an IoT project that helps you monitor and take care of your plants using a combination of hardware (ESP32 and sensors) and software (React Native with Expo, Firebase). With GardenSense, you can keep track of the soil moisture, temperature, and detect any potential threats to your plants.

## Overview

This project integrates real-time sensor data with a mobile app to provide you with vital information about your plants. The ESP32 board collects data from sensors and sends it to Firebase Realtime Database, where it's stored and made accessible through the GardenSense app built with React Native and Expo.

## Features

- Monitor soil moisture levels to ensure your plants receive the right amount of water.
- Check the temperature to guarantee an optimal environment for your plants.
- Detect motion and potential threats to your plants.

## Technologies Used

- **Hardware**: ESP32, various sensors
- **Frontend**: React Native with Expo
- **Backend**: Firebase Realtime Database and MySql

## Getting Started

This project is a starting point for creating your own plant monitoring system. To get started:

1. Clone the repository.
2. Set up your hardware (ESP32 and sensors) to collect data.
3. Configure Firebase and replace the Firebase configuration in the React Native app with your own.
4. Build and run the React Native app with Expo on your device.

For more detailed instructions, check the project documentation and guides.

## Documentation

- [Hardware Setup Guide](docs/hardware-setup.md)
- [Firebase Configuration](docs/firebase-configuration.md)
- [React Native with Expo Setup](docs/expo-app-setup.md)

## Contribute

We welcome contributions! If you want to improve this project or add new features, please follow our [contribution guidelines](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](LICENSE).

