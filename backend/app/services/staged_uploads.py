"""Publicación de nuevas cargas sin sobrescribir ni eliminar archivos anteriores."""
import os
from pathlib import Path
import tempfile
import uuid
from werkzeug.utils import secure_filename


class StagedUploads:
    def __init__(self, root):
        self.root = Path(root)
        self.temporary = []
        self.published = []
        self.commit_attempted = False

    def save(self, file, relative_directory):
        staging = self.root / '.staging'
        staging.mkdir(parents=True, exist_ok=True)
        destination = self.root / relative_directory
        destination.mkdir(parents=True, exist_ok=True)
        filename = uuid.uuid4().hex + '_' + (secure_filename(file.filename) or 'imagen')
        target = destination / filename
        fd, name = tempfile.mkstemp(dir=staging, suffix='.part')
        temporary = Path(name)
        self.temporary.append(temporary)
        with os.fdopen(fd, 'wb') as output:
            file.save(output)
            output.flush()
            os.fsync(output.fileno())
        self.published.append(target)
        # Mismo volumen: publicar completamente ANTES del commit de la referencia.
        os.replace(temporary, target)
        return target, ('uploads/' + str(Path(relative_directory) / filename).replace('\\', '/'))

    def cleanup(self):
        # Un commit con confirmación perdida podría haber tenido éxito. En ese caso
        # conservar los nuevos archivos; es preferible un huérfano a una referencia rota.
        paths = self.temporary + ([] if self.commit_attempted else self.published)
        for path in paths:
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass  # Solo restos de ESTE intento; nunca se toca el archivo original.
