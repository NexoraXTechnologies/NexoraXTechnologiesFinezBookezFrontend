import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { TextArea, TextInput } from "../inputs";

type Props = {
    form: any;
    handleChange: (key: string, value: any) => void;
};
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LocationSection = ({ form, handleChange }: Props) => {
    const [loading, setLoading] = useState(false);

    const fetchLocation = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        if (!window.isSecureContext) {
            alert("Location only works on HTTPS or localhost.");
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    handleChange("latitude", latitude);
                    handleChange("longitude", longitude);

                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );

                    const json = await response.json();

                    handleChange(
                        "locationAddress",
                        json?.results?.[0]?.formatted_address || ""
                    );
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setLoading(false);

                console.log("Error Code:", error.code);
                console.log("Error Message:", error.message);
                console.log(error);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Permission Denied");
                        break;

                    case error.POSITION_UNAVAILABLE:
                        alert("Position Unavailable");
                        break;

                    case error.TIMEOUT:
                        alert("Timeout");
                        break;

                    default:
                        alert(error.message);
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 60000,
                maximumAge: 300000,
            }
        );
    };

    return (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">

            <h3 className="mb-4 text-lg font-semibold">
                Location
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <TextInput
                    label="Latitude"
                    value={form.latitude || ""}
                    disabled
                />

                <TextInput
                    label="Longitude"
                    value={form.longitude || ""}
                    disabled
                />

            </div>

            <div className="mt-4">

                <TextArea
                    label="Location Address"
                    value={form.locationAddress || ""}
                    disabled
                />

            </div>

            <button
                type="button"
                onClick={fetchLocation}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white transition hover:opacity-90"
            >
                {loading ? (
                    <>
                        <Loader2
                            size={18}
                            className="animate-spin"
                        />
                        Fetching...
                    </>
                ) : (
                    <>
                        <MapPin size={18} />
                        Fetch Location
                    </>
                )}
            </button>

            {form.latitude && form.longitude && (
                <div className="mt-5 overflow-hidden rounded-xl border">

                    <iframe
                        title="Location"
                        width="100%"
                        height="350"
                        loading="lazy"
                        src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`}
                    />

                </div>
            )}
        </div>
    );
};

export default LocationSection;