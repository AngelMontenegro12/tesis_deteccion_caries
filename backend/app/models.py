from . import db

class Odontologo(db.Model):
    __tablename__ = 'odontologos'
    
    id_odontologo = db.Column(db.Integer, primary_key=True)
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(150), nullable=False, unique=True)
    contrasena_hash = db.Column(db.String(255), nullable=False)
    colegiatura = db.Column(db.String(50))
    especialidad = db.Column(db.String(100))
    telefono = db.Column(db.String(20))
    activo = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id_odontologo': self.id_odontologo,
            'nombres': self.nombres,
            'apellidos': self.apellidos,
            'correo': self.correo,
            'colegiatura': self.colegiatura,
            'especialidad': self.especialidad
        }

class Paciente(db.Model):
    __tablename__ = 'pacientes'
    
    id_paciente = db.Column(db.Integer, primary_key=True)
    id_odontologo = db.Column(db.Integer, db.ForeignKey('odontologos.id_odontologo'), nullable=False)
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    edad = db.Column(db.Integer, nullable=False)
    genero = db.Column(db.String(10), nullable=False)
    dni = db.Column(db.String(20), unique=True)
    telefono = db.Column(db.String(20))
    correo = db.Column(db.String(150))
    direccion = db.Column(db.String(250))
    apoderado = db.Column(db.String(200))
    telefono_apoderado = db.Column(db.String(20))
    observaciones_generales = db.Column(db.Text)
    activo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id_paciente': self.id_paciente,
            'id_odontologo': self.id_odontologo,
            'nombres': self.nombres,
            'apellidos': self.apellidos,
            'fecha_nacimiento': str(self.fecha_nacimiento),
            'edad': self.edad,
            'genero': self.genero,
            'dni': self.dni,
            'telefono': self.telefono,
            'correo': self.correo,
            'direccion': self.direccion,
            'apoderado': self.apoderado,
            'telefono_apoderado': self.telefono_apoderado,
            'observaciones_generales': self.observaciones_generales,
            'activo': self.activo
        }
