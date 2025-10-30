from flask_bcrypt import Bcrypt
from flask import Flask

# Necesitamos una instancia de Flask para inicializar Bcrypt,
# aunque no usaremos el servidor web.
app = Flask(__name__)
bcrypt = Bcrypt(app)

def create_hash():
    """
    Pide una contraseña por la terminal y genera su hash con bcrypt.
    """
    try:
        # Usamos input() para permitir pegar. ¡ADVERTENCIA: La contraseña será visible en la terminal!
        password = input("Introduce la nueva contraseña para la nevera: ")
        
        if not password:
            print("\nLa contraseña no puede estar vacía. Abortando.")
            return

        # Genera el hash. El resultado es un bytestring, lo decodificamos a utf-8.
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        print("\n¡Hash generado con éxito!")
        print("-----------------------------------------------------------------")
        print("Copia este hash y pégalo en tu archivo fridges_db.json:")
        print(hashed_password)
        print("-----------------------------------------------------------------")

    except Exception as e:
        print(f"\nOcurrió un error: {e}")

if __name__ == '__main__':
    create_hash()