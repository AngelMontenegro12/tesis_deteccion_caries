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
    rol = db.Column(db.String(20), default='odontologo')
    permisos = db.Column(db.JSON, nullable=True)
    foto_perfil = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id_odontologo': self.id_odontologo,
            'nombres': self.nombres,
            'apellidos': self.apellidos,
            'correo': self.correo,
            'telefono': self.telefono,
            'colegiatura': self.colegiatura,
            'especialidad': self.especialidad,
            'rol': self.rol,
            'permisos': self.permisos,
            'foto_perfil': self.foto_perfil
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

    evaluaciones = db.relationship('EvaluacionDiagnostica', backref='paciente', lazy=True)

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

class EvaluacionDiagnostica(db.Model):
    __tablename__ = 'evaluaciones_diagnosticas'
    
    id_evaluacion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    id_odontologo = db.Column(db.Integer, db.ForeignKey('odontologos.id_odontologo'), nullable=False)
    fecha_evaluacion = db.Column(db.DateTime, default=db.func.current_timestamp())
    tipo_visita = db.Column(db.String(50), default='Primera vez')
    motivo_consulta = db.Column(db.Text)
    observaciones = db.Column(db.Text)
    estado = db.Column(db.String(20), default='pendiente')

    def to_dict(self):
        return {
            'id_evaluacion': self.id_evaluacion,
            'id_paciente': self.id_paciente,
            'id_odontologo': self.id_odontologo,
            'fecha_evaluacion': str(self.fecha_evaluacion),
            'tipo_visita': self.tipo_visita,
            'motivo_consulta': self.motivo_consulta,
            'observaciones': self.observaciones,
            'estado': self.estado
        }

class Radiografia(db.Model):
    __tablename__ = 'radiografias'

    id_radiografia = db.Column(db.Integer, primary_key=True)
    id_evaluacion = db.Column(db.Integer, db.ForeignKey('evaluaciones_diagnosticas.id_evaluacion'), nullable=False)
    id_tipo = db.Column(db.Integer, nullable=False)
    nombre_archivo = db.Column(db.String(255), nullable=False)
    ruta_archivo = db.Column(db.String(500), nullable=False)
    formato = db.Column(db.String(20), nullable=False)
    tamanio_kb = db.Column(db.Integer)
    resolucion = db.Column(db.String(50))
    estado_procesado = db.Column(db.String(20), default='pendiente')
    creado_en = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id_radiografia': self.id_radiografia,
            'id_evaluacion': self.id_evaluacion,
            'id_tipo': self.id_tipo,
            'nombre_archivo': self.nombre_archivo,
            'ruta_archivo': self.ruta_archivo,
            'formato': self.formato,
            'tamanio_kb': self.tamanio_kb,
            'resolucion': self.resolucion,
            'estado_procesado': self.estado_procesado,
            'creado_en': str(self.creado_en)
        }

class DiagnosticoOdontologo(db.Model):
    __tablename__ = 'diagnosticos_odontologo'
    
    id_diagnostico = db.Column(db.Integer, primary_key=True)
    id_evaluacion = db.Column(db.Integer, db.ForeignKey('evaluaciones_diagnosticas.id_evaluacion', ondelete='CASCADE'), nullable=False)
    id_odontologo = db.Column(db.Integer, db.ForeignKey('odontologos.id_odontologo', ondelete='RESTRICT'), nullable=False)
    diagnostico_texto = db.Column(db.Text, nullable=False, default='Sin diagnostico redactado')
    plan_tratamiento = db.Column(db.Text)
    confirma_ia = db.Column(db.Boolean, default=True)
    observaciones = db.Column(db.Text)
    fecha_diagnostico = db.Column(db.DateTime, default=db.func.current_timestamp())
    actualizado_en = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id_diagnostico': self.id_diagnostico,
            'id_evaluacion': self.id_evaluacion,
            'id_odontologo': self.id_odontologo,
            'diagnostico_texto': self.diagnostico_texto,
            'plan_tratamiento': self.plan_tratamiento,
            'confirma_ia': self.confirma_ia,
            'observaciones': self.observaciones,
            'fecha_diagnostico': self.fecha_diagnostico.isoformat() if self.fecha_diagnostico else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }

class ResultadosDeteccion(db.Model):
    __tablename__ = 'resultados_deteccion'
    
    id_resultado = db.Column(db.Integer, primary_key=True)
    id_radiografia = db.Column(db.Integer, db.ForeignKey('radiografias.id_radiografia', ondelete='CASCADE'), nullable=False)
    modelo_version = db.Column(db.String(50), nullable=False)
    caries_detectada = db.Column(db.Boolean, nullable=False)
    confianza_global = db.Column(db.Numeric(5, 4))
    imagen_resultado = db.Column(db.String(500))
    tiempo_proceso_ms = db.Column(db.Integer)
    error_descripcion = db.Column(db.Text)
    creado_en = db.Column(db.DateTime, default=db.func.current_timestamp())

    detecciones = db.relationship('DeteccionesCaries', backref='resultado', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id_resultado': self.id_resultado,
            'id_radiografia': self.id_radiografia,
            'modelo_version': self.modelo_version,
            'caries_detectada': self.caries_detectada,
            'confianza_global': float(self.confianza_global) if self.confianza_global else None,
            'imagen_resultado': self.imagen_resultado,
            'tiempo_proceso_ms': self.tiempo_proceso_ms,
            'error_descripcion': self.error_descripcion,
            'creado_en': str(self.creado_en)
        }

class DeteccionesCaries(db.Model):
    __tablename__ = 'detecciones_caries'
    
    id_deteccion = db.Column(db.Integer, primary_key=True)
    id_resultado = db.Column(db.Integer, db.ForeignKey('resultados_deteccion.id_resultado', ondelete='CASCADE'), nullable=False)
    id_localizacion = db.Column(db.Integer, nullable=False, default=1)
    numero_diente = db.Column(db.String(10))
    confianza = db.Column(db.Numeric(5, 4), nullable=False)
    bbox_x = db.Column(db.Integer)
    bbox_y = db.Column(db.Integer)
    bbox_ancho = db.Column(db.Integer)
    bbox_alto = db.Column(db.Integer)
    severidad = db.Column(db.Enum('incipiente', 'moderada', 'avanzada'), nullable=True)
    class_probabilities = db.Column(db.JSON, nullable=True)
    creado_en = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id_deteccion': self.id_deteccion,
            'id_resultado': self.id_resultado,
            'id_localizacion': self.id_localizacion,
            'numero_diente': self.numero_diente,
            'confianza': float(self.confianza),
            'bbox_x': self.bbox_x,
            'bbox_y': self.bbox_y,
            'bbox_ancho': self.bbox_ancho,
            'bbox_alto': self.bbox_alto,
            'severidad': self.severidad,
            'class_probabilities': self.class_probabilities,
            'creado_en': str(self.creado_en)
        }

class SolicitudRol(db.Model):
    __tablename__ = 'solicitudes_rol'
    
    id_solicitud = db.Column(db.Integer, primary_key=True)
    id_solicitante = db.Column(db.Integer, db.ForeignKey('odontologos.id_odontologo'), nullable=False)
    id_odontologo_objetivo = db.Column(db.Integer, db.ForeignKey('odontologos.id_odontologo'), nullable=False)
    estado = db.Column(db.String(20), default='pendiente')
    fecha_solicitud = db.Column(db.DateTime, default=db.func.current_timestamp())

    solicitante = db.relationship('Odontologo', foreign_keys=[id_solicitante])
    objetivo = db.relationship('Odontologo', foreign_keys=[id_odontologo_objetivo])

    def to_dict(self):
        return {
            'id_solicitud': self.id_solicitud,
            'id_solicitante': self.id_solicitante,
            'id_odontologo_objetivo': self.id_odontologo_objetivo,
            'estado': self.estado,
            'fecha_solicitud': str(self.fecha_solicitud),
            'solicitante_nombre': f"{self.solicitante.nombres} {self.solicitante.apellidos}" if self.solicitante else None,
            'objetivo_nombre': f"{self.objetivo.nombres} {self.objetivo.apellidos}" if self.objetivo else None,
            'objetivo_rol_actual': self.objetivo.rol if self.objetivo else None,
            'tipo_solicitud': 'Cambio de Rol'
        }

from sqlalchemy.dialects.mysql import INTEGER

class SolicitudPassword(db.Model):
    __tablename__ = 'solicitudes_password'
    
    id_solicitud = db.Column(db.Integer, primary_key=True)
    id_odontologo = db.Column(INTEGER(unsigned=True), db.ForeignKey('odontologos.id_odontologo'), nullable=False)
    estado = db.Column(db.String(20), default='pendiente')
    fecha_solicitud = db.Column(db.DateTime, default=db.func.current_timestamp())

    odontologo = db.relationship('Odontologo', foreign_keys=[id_odontologo])

    def to_dict(self):
        return {
            'id_solicitud': f"pwd_{self.id_solicitud}",
            'id_solicitante': self.id_odontologo,
            'estado': self.estado,
            'fecha_solicitud': str(self.fecha_solicitud),
            'solicitante_nombre': f"{self.odontologo.nombres} {self.odontologo.apellidos}" if self.odontologo else None,
            'objetivo_nombre': f"{self.odontologo.nombres} {self.odontologo.apellidos}" if self.odontologo else None,
            'objetivo_rol_actual': self.odontologo.rol if self.odontologo else None,
            'tipo_solicitud': 'Restablecer Contraseña',
            'correo': self.odontologo.correo if self.odontologo else None
        }
