with open('app/routes/evaluaciones.py', 'a', encoding='utf-8') as f:
    f.write('''
@evaluaciones_bp.route('/<int:id_evaluacion>/detalle', methods=['GET'])
def obtener_evaluacion_detalle(id_evaluacion):
    from sqlalchemy import text
    from app.models import EvaluacionDiagnostica, Paciente, Radiografia, DiagnosticoOdontologo
    from app import db
    try:
        evaluacion = EvaluacionDiagnostica.query.get_or_404(id_evaluacion)
        paciente = Paciente.query.get_or_404(evaluacion.id_paciente)
        
        # Radiografias directly mapped to Evaluacion
        rads = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        radiografias_data = []
        for rad in rads:
            # Find result id if any using text
            sql = text("SELECT id_resultado FROM resultados_deteccion WHERE id_radiografia = :id_rad")
            res = db.session.execute(sql, {"id_rad": rad.id_radiografia}).fetchone()
            id_res = res[0] if res else None
            
            ruta = rad.ruta_archivo.replace('\\\\', '/') if rad.ruta_archivo else ''
            radiografias_data.append({
                'id_radiografia': rad.id_radiografia,
                'ruta_archivo': ruta,
                'id_resultado': id_res
            })

        # Detecciones
        detecciones_data = []
        for rd in radiografias_data:
            if rd['id_resultado']:
                sql_det = text("SELECT id_deteccion, numero_diente, confianza, severidad, bbox_x, bbox_y, bbox_ancho, bbox_alto FROM detecciones_caries WHERE id_resultado = :id_res")
                dets = db.session.execute(sql_det, {"id_res": rd['id_resultado']}).fetchall()
                for d in dets:
                    detecciones_data.append({
                        'id_resultado': rd['id_resultado'],
                        'numero_diente': d[1],
                        'confianza': d[2],
                        'severidad': d[3],
                        'bbox_x': d[4],
                        'bbox_y': d[5],
                        'bbox_ancho': d[6],
                        'bbox_alto': d[7]
                    })

        # Diagnostico final
        diagnostico = DiagnosticoOdontologo.query.filter_by(id_evaluacion=id_evaluacion).order_by(DiagnosticoOdontologo.fecha_diagnostico.desc()).first()
        diagnostico_data = None
        if diagnostico:
            diagnostico_data = {
                'diagnostico_texto': diagnostico.diagnostico_texto,
                'plan_tratamiento': diagnostico.plan_tratamiento,
                'observaciones': diagnostico.observaciones
            }

        return jsonify({
            'evaluacion': evaluacion.to_dict(),
            'paciente': paciente.to_dict(),
            'radiografias': radiografias_data,
            'detecciones_caries': detecciones_data,
            'diagnostico': diagnostico_data
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
''')
