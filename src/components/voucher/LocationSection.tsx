import { useState } from "react";
import { TextArea } from "../inputs";
import { PrimaryButton } from "../buttons";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, MapPin } from "lucide-react";
import { toast } from "react-toastify";

type Props = { form: any; handleChange: (key: string, value: any) => void; };
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LocationSection = ({ form, handleChange }: Props) => {
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const fetchLocation = async () => {
        if (!navigator.geolocation) return toast.error("Geolocation is not supported by your browser.")
        if (!window.isSecureContext) return toast.error("Location only works on HTTPS or localhost.")
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    handleChange("latitude", latitude);
                    handleChange("longitude", longitude);
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const json = await response.json();
                    handleChange("locationAddress", json?.results?.[0]?.formatted_address || "");
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
                        toast.error("Permission Denied");
                        break;

                    case error.POSITION_UNAVAILABLE:
                        toast.error("Position Unavailable");
                        break;

                    case error.TIMEOUT:
                        toast.error("Timeout");
                        break;

                    default:
                        toast.error(error.message);
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
        <div className="mt-3 rounded-xl">
            <TextArea
                label="Location Address"
                value={form.locationAddress || ""}
                disabled
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <PrimaryButton
                    {...{
                        callBackFn: fetchLocation,
                        text: "Fetch Location",
                        disabled: loading,
                        loader: loading,
                    }}
                />

                {form.latitude && form.longitude ? (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowMap((previous) => !previous)}
                        className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-card-foreground transition hover:bg-muted"
                    >
                        <MapPin size={16} />
                        {showMap ? "Hide Map" : "View Map"}
                        <motion.span
                            animate={{ rotate: showMap ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} />
                        </motion.span>
                    </motion.button>
                ) : null}
            </div>

            {form.latitude && form.longitude ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <MapPin size={19} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-card-foreground">
                                    Location Captured
                                </p>

                                <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                                    {form.latitude}, {form.longitude}
                                </p>
                            </div>
                        </div>

                        <a
                            href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                            <ExternalLink size={14} />
                            Open in Maps
                        </a>
                    </div>

                    <AnimatePresence initial={false}>
                        {showMap ? (
                            <motion.div
                                initial={{
                                    height: 0,
                                    opacity: 0,
                                    marginTop: 0,
                                }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: 12,
                                }}
                                exit={{
                                    height: 0,
                                    opacity: 0,
                                    marginTop: 0,
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: "easeInOut",
                                }}
                                className="overflow-hidden"
                            >
                                <motion.div
                                    initial={{ scale: 0.98 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.98 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden rounded-lg border border-border"
                                >
                                    <iframe
                                        title="Location"
                                        width="100%"
                                        height="220"
                                        loading="lazy"
                                        className="block w-full"
                                        src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`}
                                    />
                                </motion.div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </motion.div>
            ) : null}
        </div>
    );
};

export default LocationSection;