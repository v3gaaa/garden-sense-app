# GardenSense

GardenSense is an IoT project that empowers you to monitor and care for your plants efficiently, using a combination of hardware (ESP32 and sensors) and software (React Native with Expo, Firebase, Python and FastAPI). With GardenSense, you can keep track of soil moisture, temperature, and detect potential threats to your plants.

## Overview

This project integrates real-time sensor data with a mobile app to provide crucial information about your plants. The ESP32 board collects data from sensors and sends it to Firebase Realtime Database, where it's made accessible through the GardenSense app built with React Native and Expo. Additionally, the backend API is hosted on AWS, providing seamless communication between the hardware and the database and stores logs of the sensors data.

## Features

- Monitor soil moisture levels to ensure your plants receive the right amount of water.
- Check the temperature to guarantee an optimal environment for your plants.
- Detect motion and potential threats to your plants.

## Technologies Used

- **Hardware**: ESP32, various sensors
- **Frontend**: React Native with Expo
- **Backend**: FastAPI (Python)
- **Database**: MySQL hosted on AWS RDS and Firebase RDB

## Getting Started

This project serves as a foundation for creating your own plant monitoring system. To get started:

1. Clone the repository.
2. Set up your hardware (ESP32 and sensors) to collect data.
3. Configure Firebase and replace the Firebase configuration in the React Native app with your own. Follow the [Firebase Configuration Guide](https://firebase.google.com/docs/database).
4. Deploy the FastAPI backend on [Railway](https://railway.app/) or any other cloud service, and configure the MySQL database on AWS RDS. Detailed instructions can be found in [AWS RDS docs](https://docs.aws.amazon.com/rds/)
5. Build and run the React Native app with Expo on your device.

For more detailed instructions, check the project documentation and guides.

## Documentation

- [Hardware Setup Guide](docs/hardware-setup.md)
- [Firebase Configuration](docs/firebase-configuration.md)
- [React Native with Expo Setup](docs/expo-app-setup.md)

## License

This project is licensed under the [MIT License](LICENSE).

