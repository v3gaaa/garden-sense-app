from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from apscheduler.schedulers.background import BackgroundScheduler
import requests
from datetime import datetime, timedelta
import time

app = FastAPI()

# Variables globales para almacenar los detalles de la planta seleccionada
planta_seleccionada = {"nombre": "", "minhum": 0, "maxhum": 0}
estado = {"riego": 0}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Esto permite solicitudes desde cualquier origen, pero deberías limitarlo a los dominios que necesitas.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de la conexión a la base de datos
conexion = mysql.connector.connect(
    host="gardensense.cllvtomg7jyh.us-east-2.rds.amazonaws.com",
    user="admin",
    password="12345678",  # Cambiar por la contraseña real
    database="gardensense"
)

# Crear un cursor para ejecutar consultas SQL
cursor = conexion.cursor()

# Crear la tabla 'data_sensores' si aún no existe
create_sensores_table_query = """
CREATE TABLE IF NOT EXISTS data_sensores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    humedad FLOAT,
    movimiento INT,
    temperatura FLOAT,
    user VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

cursor.execute(create_sensores_table_query)
conexion.commit()

# Crear la tabla 'data_plantas' si aún no existe
create_plantas_table_query = """
CREATE TABLE IF NOT EXISTS data_plantas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    mintemp INT,
    maxtemp INT,
    minhum INT,
    maxhum INT
);
"""

cursor.execute(create_plantas_table_query)
conexion.commit()

# Verificar si la tabla 'data_plantas' está vacía
check_plantas_query = "SELECT COUNT(*) FROM data_plantas"
cursor.execute(check_plantas_query)
count = cursor.fetchone()[0]

# Si la tabla está vacía, insertar datos iniciales
if count == 0:
    insert_inicial_plantas_query = """
    INSERT INTO data_plantas (nombre, mintemp, maxtemp, minhum, maxhum) VALUES
    ('Tomate', 20, 28, 60, 80),
    ('Pimiento', 22, 30, 50, 70),
    ('Zanahoria', 15, 25, 50, 70),
    ('FueraMin', 1, 2, 1, 2),
    ('FueraMax', 99, 100, 99, 100),
    ('EnRango', 1, 100, 1, 100);
    """
    cursor.execute(insert_inicial_plantas_query)
    conexion.commit()

# Función para insertar datos en la tabla 'data_sensores'
def insert_sensor_data(humedad, movimiento, temperatura, user):
    """
    Inserta datos de sensores en la tabla 'data_sensores'.
    """
    insert_data_query = """
    INSERT INTO data_sensores (humedad, movimiento,temperatura,user) VALUES (%s, %s, %s, %s);
    """
    sensor_data = (humedad, movimiento, temperatura, user)
    cursor.execute(insert_data_query, sensor_data)
    conexion.commit()

# Endpoint principal
@app.get("/")
async def root():
    """
    Endpoint principal para la API de GardenSense.
    """
    return {"message": "Bienvenido a la API de GardenSense"}

# Endpoint para obtener datos de los sensores
@app.get("/sensores")
async def get_sensor_data():
    """
    Obtiene los datos más recientes de los sensores desde la base de datos.
    """
    try:
        # Ejecutar una consulta SQL para obtener los últimos datos de la tabla 'data_sensores'
        query = "SELECT humedad, movimiento, temperatura, timestamp FROM data_sensores ORDER BY timestamp DESC LIMIT 1;"
        cursor.execute(query)
        result = cursor.fetchone()

        if result:
            # Extraer los valores de la consulta
            humedad, movimiento, temperatura, timestamp = result

            # Formatear la respuesta
            response_data = {
                "humedad": humedad,
                "movimiento": movimiento,
                "temperatura": temperatura,
                "timestamp": timestamp.isoformat() if timestamp else None
            }

            return response_data
        else:
            return JSONResponse(content={"message": "No hay datos disponibles"}, status_code=404)
    except Exception as e:
        print(f"Error al obtener datos de los sensores: {str(e)}")
        return JSONResponse(content={"message": "Error al obtener datos de los sensores"}, status_code=500)

# Función para insertar datos en la tabla 'data_plantas'
def insert_planta_data(nombre, mintemp, maxtemp, minhum, maxhum):
    """
    Inserta datos de plantas en la tabla 'data_plantas'.
    """
    insert_planta_query = """
    INSERT INTO data_plantas (nombre, mintemp, maxtemp, minhum, maxhum) VALUES (%s, %s, %s, %s, %s);
    """
    planta_data = (nombre, mintemp, maxtemp, minhum, maxhum)
    cursor.execute(insert_planta_query, planta_data)
    conexion.commit()

# Endpoint para obtener datos de todas las plantas
@app.get("/plantas")
async def get_plantas():
    """
    Obtiene datos de todas las plantas desde la base de datos.
    """
    try:
        # Ejecutar una consulta SQL para obtener todos los datos de la tabla 'data_plantas'
        query = "SELECT id, nombre, mintemp, maxtemp, minhum, maxhum FROM data_plantas;"
        cursor.execute(query)
        results = cursor.fetchall()

        # Formatear la respuesta
        plantas_data = [
            {
                "id": id,
                "nombre": nombre,
                "mintemp": mintemp,
                "maxtemp": maxtemp,
                "minhum": minhum,
                "maxhum": maxhum,
            }
            for id, nombre, mintemp, maxtemp, minhum, maxhum in results
        ]

        return plantas_data
    except Exception as e:
        print(f"Error al obtener datos de las plantas: {str(e)}")
        return JSONResponse(content={"message": "Error al obtener datos de las plantas"}, status_code=500)

# Endpoint para añadir una nueva planta
@app.post("/plantas/nueva")
async def add_planta(planta: dict):
    """
    Añade una nueva planta a la base de datos.
    """
    try:
        # Validar que se proporcionen todos los campos necesarios
        required_fields = ["nombre", "mintemp", "maxtemp", "minhum", "maxhum"]
        for field in required_fields:
            if field not in planta:
                return JSONResponse(content={"message": f"El campo '{field}' es obligatorio"}, status_code=400)

        # Llamar a la función para insertar los datos de la nueva planta
        insert_planta_data(planta["nombre"], planta["mintemp"], planta["maxtemp"], planta["minhum"], planta["maxhum"])
        return JSONResponse(content={"message": "Nueva planta añadida correctamente"}, status_code=201)

    except Exception as e:
        print(f"Error al añadir nueva planta: {str(e)}")
        return JSONResponse(content={"message": "Error al añadir nueva planta"}, status_code=500)

# Endpoint para actualizar los detalles de la planta seleccionada
@app.post("/plantas/seleccionada")
async def set_planta_seleccionada(planta: dict):
    """
    Actualiza los detalles de la planta seleccionada.
    """
    global planta_seleccionada

    # Imprime la planta seleccionada actual antes de la actualización
    print("Planta seleccionada anterior:", planta_seleccionada)

    # Actualiza cada campo de la planta seleccionada
    planta_seleccionada.update(planta)

    # Imprime la planta seleccionada actualizada
    print("Planta seleccionada actualizada:", planta_seleccionada)

    return {"message": "Detalles de planta actualizados correctamente"}

# Endpoint para mandar los detalles de la planta seleccionada
@app.get("/plantas/seleccionada/enviar")
async def get_planta_seleccionada():
    """
    Obtiene los detalles de la planta seleccionada.
    """
    return planta_seleccionada

# Endpoint para obtener nombres de todas las plantas
@app.get("/plantas/nombres")
async def get_nombres_plantas():
    """
    Obtiene los nombres de todas las plantas desde la base de datos.
    """
    try:
        # Ejecutar una consulta SQL para obtener los nombres de todas las plantas
        query = "SELECT nombre FROM data_plantas;"
        cursor.execute(query)
        results = cursor.fetchall()

        # Formatear la respuesta
        nombres_plantas = [result[0] for result in results]
        return nombres_plantas
    except Exception as e:
        print(f"Error al obtener nombres de las plantas: {str(e)}")
        return JSONResponse(content={"message": "Error al obtener nombres de las plantas"}, status_code=500)

# Endpoint para obtener detalles de una planta específica
@app.get("/plantas/{nombre_planta}")
async def get_planta_details(nombre_planta: str):
    """
    Obtiene los detalles de una planta específica desde la base de datos.
    """
    try:
        # Ejecutar una consulta SQL para obtener los detalles de la planta específica
        query = "SELECT id, nombre, mintemp, maxtemp, minhum, maxhum FROM data_plantas WHERE nombre = %s;"
        cursor.execute(query, (nombre_planta,))
        result = cursor.fetchone()

        if result:
            # Formatear la respuesta
            planta_data = {
                "id": result[0],
                "nombre": result[1],
                "mintemp": result[2],
                "maxtemp": result[3],
                "minhum": result[4],
                "maxhum": result[5],
            }
            return planta_data
        else:
            return JSONResponse(content={"message": "Planta no encontrada"}, status_code=404)
    except Exception as e:
        print(f"Error al obtener detalles de la planta: {str(e)}")
        return JSONResponse(content={"message": "Error al obtener detalles de la planta"}, status_code=500)

# Endpoint para recibir el estado del riego
@app.get("/riego")
async def get_riego():
    """
    Obtiene el estado actual del riego.
    """
    global estado
    return estado

# Endpoint para actualizar el estado del riego
@app.post("/riego/set")
async def set_riego(status: dict):
    """
    Actualiza el estado del riego.
    """
    global estado

    print("Estado anterior:", estado)

    estado.update(status)

    print("Estado actualizado:", estado)

    return {"message": "Estado actualizado correctamente"}


# Función que se ejecutará cada 10 minutos para alimentar la base de datos
def feed_database():
    """
    Actualiza la base de datos MySQL con datos de Firebase.

    Realiza una solicitud GET a la base de datos de Firebase, obtiene los datos
    y los inserta en la tabla 'data_sensores' de la base de datos MySQL.

    """
    try:
        # URL de tu base de datos en tiempo real de Firebase
        firebase_url = "https://gardensense-cfe37-default-rtdb.firebaseio.com/sensores.json"

        # Realizar la solicitud GET a la base de datos de Firebase
        response = requests.get(firebase_url)

        # Verificar si la solicitud fue exitosa (código de respuesta 200)
        if response.status_code == 200:
            # Obtener los datos de la respuesta
            firebase_data = response.json()

            # Supongamos que los datos de Firebase tienen una estructura como esta:
            humedad = firebase_data.get("humedad")
            movimiento = firebase_data.get("movimiento")
            temperatura = firebase_data.get("temperatura")
            user = firebase_data.get("user")

            # Llamar a la función para insertar los datos en la base de datos MySQL
            insert_sensor_data(humedad, movimiento, temperatura, user)
            print("Base de datos alimentada exitosamente.")
        else:
            print(f"Error al obtener datos de Firebase. Código de respuesta: {response.status_code}")

    except Exception as e:
        print(f"Error al alimentar la base de datos: {str(e)}")

# Configuración de la tarea programada con APScheduler
scheduler = BackgroundScheduler()
scheduler.add_job(feed_database, 'interval', minutes=10)
scheduler.start()

# Función que se ejecuta al cerrar la aplicación
def close_database_connection():
    """
    Cierra la conexión a la base de datos MySQL.

    Esta función se ejecuta al cerrar la aplicación para garantizar
    que la conexión se cierre correctamente.

    """
    cursor.close()
    conexion.close()

# Configurar la función de cierre al cerrar la aplicación
@app.on_event("shutdown")
def shutdown_event():
    close_database_connection()
    scheduler.shutdown()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

