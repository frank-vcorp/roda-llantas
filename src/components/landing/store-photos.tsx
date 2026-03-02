/**
 * Componente Cliente: StorePhotos
 * Galería de fotos del local con manejo de errores de imagen.
 * Separado como componente cliente para poder usar onError.
 *
 * @id IMPL-20260302-LANDING
 * @author SOFIA - Builder
 */
"use client";

interface Photo {
    src: string;
    alt: string;
    caption: string;
}

interface StorePhotosProps {
    photos: Photo[];
}

export function StorePhotos({ photos }: StorePhotosProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {photos.map((photo, i) => (
                <PhotoCard key={i} photo={photo} />
            ))}
        </div>
    );
}

function PhotoCard({ photo }: { photo: Photo }) {
    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        // Si la imagen falla, ocultar el contenedor completo
        const container = target.closest(".photo-card") as HTMLElement | null;
        if (container) container.style.display = "none";
    };

    return (
        <div className="photo-card relative group overflow-hidden rounded-2xl shadow-lg h-72">
            <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={handleError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 text-white font-semibold text-sm">{photo.caption}</p>
        </div>
    );
}
