import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, MapPin, IndianRupee, BedDouble, ImagePlus, CheckCircle2, ChevronRight, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";

const schema = z.object({
  title: z.string().min(3, "Enter at least 3 characters"),
  gender: z.enum(["MEN", "WOMEN", "CO_LIVING"]),
  description: z.string().min(10, "Please enter at least 10 characters"),
  address: z.string().min(5, "Enter the property address"),
  locality: z.string().min(2, "Enter the locality"),
  city: z.string().min(2, "Enter the city"),
  monthlyRent: z.coerce.number().int().positive("Enter a valid monthly rent"),
  deposit: z.coerce.number().int().min(0, "Deposit cannot be negative"),
  roomType: z.enum(["SHARED", "SINGLE"]),
  totalBeds: z.coerce.number().int().min(1, "At least one bed is required"),
  availableBeds: z.coerce.number().int().min(0, "Cannot be negative"),
}).refine(data => data.availableBeds <= data.totalBeds, {
  message: "Available beds cannot exceed total beds", path: ["availableBeds"],
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;
type BedRecord = {
  id: string;
  bedNumber?: string;
  roomId?: string;
  status?: string;
  monthlyRent?: number | null;
};
type RoomRecord = {
  id: string;
  name?: string;
  roomType?: string;
  capacity?: number;
  monthlyRent?: number | null;
  beds?: BedRecord[];
};
type ListingRecord = {
  id: string;
  name?: string;
  category?: string;
  genderPolicy?: string;
  description?: string;
  address?: string;
  locality?: string;
  city?: string;
  monthlyRent?: number | string | null;
  deposit?: number | string | null;
  rooms?: RoomRecord[];
};

const amenities = ["Wi-Fi", "Food included", "Washing machine", "Housekeeping", "Power backup", "Parking", "Hot water", "CCTV", "AC"];

export default function CreateListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [loadingListing, setLoadingListing] = useState(isEditMode);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormInput, any, FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { gender: "CO_LIVING", city: "Bengaluru", deposit: 0, roomType: "SHARED", totalBeds: 1, availableBeds: 1 },
    });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function loadListing() {
      try {
        setLoadingListing(true);
        setMessage("");
        const response = await api.get(`/listings/${id}`);
        const listing: ListingRecord | undefined = response.data?.listing ?? response.data?.data?.listing;
        if (!listing) throw new Error("Unable to find this PG listing.");
        const rooms = listing.rooms ?? [];
        const actualBeds = rooms.flatMap(room => room.beds ?? []);
        const totalBeds = actualBeds.length || rooms.reduce((sum, room) => sum + Number(room.capacity ?? 0), 0);
        const availableBeds = actualBeds.filter(bed => String(bed.status ?? "").toUpperCase() === "AVAILABLE").length;
        const category = String(listing.category ?? listing.genderPolicy ?? "CO_LIVING").toUpperCase();
        const gender = category === "MEN" || category === "MALE" ? "MEN" : category === "WOMEN" || category === "FEMALE" ? "WOMEN" : "CO_LIVING";
        const roomTypeValue = String(rooms[0]?.roomType ?? "SHARED").toUpperCase();
        if (cancelled) return;
        reset({
          title: listing.name ?? "", gender, description: listing.description ?? "",
          address: listing.address ?? "", locality: listing.locality ?? "", city: listing.city ?? "Bengaluru",
          monthlyRent: Number(listing.monthlyRent ?? 1), deposit: Number(listing.deposit ?? 0),
          roomType: roomTypeValue.includes("SINGLE") ? "SINGLE" : "SHARED",
          totalBeds: Math.max(1, totalBeds), availableBeds,
        });
        // Amenity and photo persistence are not supported by the current backend endpoints.
      } catch (error: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(error)) {
            setMessage(error.response?.status === 401 ? "Error: Please log in again to edit this PG." :
              error.response?.status === 404 ? "Error: PG listing not found." :
              `Error: ${error.response?.data?.message ?? "Unable to load this PG."}`);
          } else setMessage(error instanceof Error ? `Error: ${error.message}` : "Unable to load this PG.");
        }
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    }
    void loadListing();
    return () => { cancelled = true; };
  }, [id, reset]);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities(current => current.includes(amenity) ? current.filter(item => item !== amenity) : [...current, amenity]);
  }

  async function syncRoomAndBeds(listingId: string, data: FormValues) {
    const listingResponse = await api.get(`/listings/${listingId}`);
    const listing: ListingRecord | undefined =
      listingResponse.data?.listing ??
      listingResponse.data?.data?.listing;

    if (!listing) {
      throw new Error("PG was saved but could not reload its rooms.");
    }

    const rooms = listing.rooms ?? [];

    // This form manages one room only. Do not accidentally modify other rooms.
    if (rooms.length > 1) {
      throw new Error(
        "This PG has multiple rooms. Manage their beds from the Rooms and Bed Availability pages."
      );
    }

    let room = rooms[0];

    if (!room) {
      // POST /rooms creates the room AND all its beds in the backend.
      const created = await api.post("/rooms", {
        name: "Room 1",
        roomType: data.roomType,
        capacity: data.totalBeds,
        monthlyRent: data.monthlyRent,
        listingId,
      });

      room = created.data?.room ?? created.data;
      if (!room?.id) {
        throw new Error("PG was saved, but the room API did not return a room ID.");
      }
    } else {
      const existingBeds = [...(room.beds ?? [])].sort((a, b) => {
        const number = (bed: BedRecord) =>
          Number((bed.bedNumber ?? "").match(/\\d+/)?.[0] ?? 0);
        return number(a) - number(b);
      });

      // Delete extra beds before lowering capacity. Only AVAILABLE beds may be removed.
      if (existingBeds.length > data.totalBeds) {
        const extras = existingBeds.slice(data.totalBeds);
        const protectedBeds = extras.filter(
          bed => String(bed.status ?? "").toUpperCase() !== "AVAILABLE"
        );

        if (protectedBeds.length > 0) {
          throw new Error(
            "Total beds cannot be reduced because one or more beds being removed are not available. Update bed statuses first."
          );
        }

        for (const bed of extras) {
          await api.delete(`/beds/${bed.id}`);
        }
      }

      // The backend room update creates any missing beds automatically.
      await api.patch(`/rooms/${room.id}`, {
        name: room.name ?? "Room 1",
        roomType: data.roomType,
        capacity: data.totalBeds,
        monthlyRent: data.monthlyRent,
      });
    }

    // Reload the listing so we use the actual bed records created by the backend.
    const refreshedResponse = await api.get(`/listings/${listingId}`);
    const refreshedListing: ListingRecord | undefined =
      refreshedResponse.data?.listing ??
      refreshedResponse.data?.data?.listing;

    const refreshedRoom = refreshedListing?.rooms?.find(
      item => item.id === room!.id
    );

    if (!refreshedRoom) {
      throw new Error("Room was saved, but its beds could not be reloaded.");
    }

    const beds = [...(refreshedRoom.beds ?? [])].sort((a, b) => {
      const number = (bed: BedRecord) =>
        Number((bed.bedNumber ?? "").match(/\\d+/)?.[0] ?? 0);
      return number(a) - number(b);
    });

    if (beds.length !== data.totalBeds) {
      throw new Error(
        `Expected ${data.totalBeds} beds, but the backend returned ${beds.length}. Please check the room controller.`
      );
    }

    // The form's available-bed count is authoritative:
    // first N beds are AVAILABLE, the rest are OCCUPIED.
    await Promise.all(
      beds.map((bed, index) => {
        const desiredStatus =
          index < data.availableBeds ? "AVAILABLE" : "OCCUPIED";

        if (String(bed.status ?? "").toUpperCase() === desiredStatus) {
          return Promise.resolve();
        }

        return api.patch(`/beds/${bed.id}`, {
          status: desiredStatus,
          monthlyRent: data.monthlyRent,
        });
      })
    );
  }

  async function onSubmit(data: FormValues) {
    setMessage("");
    try {
      if (id) {
        await api.patch(`/listings/${id}`, {
          name: data.title, category: data.gender, description: data.description,
          address: data.address, locality: data.locality, city: data.city,
          state: "Karnataka", genderPolicy: data.gender,
          monthlyRent: data.monthlyRent, deposit: data.deposit,
        });
        await syncRoomAndBeds(id, data);
        navigate("/listings", { replace: true, state: { listingUpdated: true } });
        return;
      }

      const listingResponse = await api.post("/listings", {
        name: data.title, category: data.gender, description: data.description,
        address: data.address, locality: data.locality, city: data.city,
        state: "Karnataka", genderPolicy: data.gender,
        monthlyRent: data.monthlyRent, deposit: data.deposit, status: "DRAFT",
      });
      const listingId = listingResponse.data?.listing?.id ?? listingResponse.data?.id;
      if (!listingId) throw new Error("The API did not return a listing ID.");
      // POST /rooms creates the room and all beds automatically.
      const roomResponse = await api.post("/rooms", {
        name: "Room 1",
        roomType: data.roomType,
        capacity: data.totalBeds,
        monthlyRent: data.monthlyRent,
        listingId,
      });

      const room = roomResponse.data?.room ?? roomResponse.data;
      if (!room?.id) {
        throw new Error(
          `PG saved, but no room ID was returned. Listing ID: ${listingId}`
        );
      }

      // All new beds are AVAILABLE by default. Mark the required number OCCUPIED.
      const createdBeds: BedRecord[] = room.beds ?? [];
      if (createdBeds.length !== data.totalBeds) {
        throw new Error(
          `Room created, but expected ${data.totalBeds} beds and received ${createdBeds.length}. Check the backend room controller.`
        );
      }

      const sortedBeds = [...createdBeds].sort((a, b) => {
        const number = (bed: BedRecord) =>
          Number((bed.bedNumber ?? "").match(/\\d+/)?.[0] ?? 0);
        return number(a) - number(b);
      });

      await Promise.all(
        sortedBeds.map((bed, index) => {
          const desiredStatus =
            index < data.availableBeds ? "AVAILABLE" : "OCCUPIED";

          if (String(bed.status ?? "").toUpperCase() === desiredStatus) {
            return Promise.resolve();
          }

          return api.patch(`/beds/${bed.id}`, {
            status: desiredStatus,
            monthlyRent: data.monthlyRent,
          });
        })
      );
      // Photos and amenities are only held in the form until the backend supports persistence.
      setMessage(`PG "${data.title}" and its ${data.totalBeds} beds were saved successfully!`);
      setSelectedAmenities([]);
      setPhotos([]);
    } catch (error: unknown) {
      console.error("Failed to save BedNear PG listing:", error);
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message ?? error.response?.data?.error;
        setMessage(`Error: ${typeof apiMessage === "string" ? apiMessage :
          error.response?.status === 401 ? "Please log in again." :
          error.response?.status === 404 ? "An API endpoint was not found. Check your backend routes." :
          "Unable to save the PG. Check the backend terminal."}`);
      } else setMessage(`Error: ${error instanceof Error ? error.message : "Unexpected error while saving the PG."}`);
    }
  }

  return (
    <div className="listing-page">
      <Link to="/listings" className="back-link"><ArrowLeft size={17} /> Back to My PGs</Link>
      <div className="listing-heading"><div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>{isEditMode ? "Edit PG Details" : "Add a New PG"}</h1><p className="dashboard-subtitle">{isEditMode ? "Update property, rent and bed availability." : "Add accurate property details to help candidates find your PG."}</p></div><div className="listing-heading-icon"><Building2 size={27} /></div></div>
      {message && <div className={message.startsWith("Error:") ? "form-error" : "form-success"} role="status"><CheckCircle2 size={19} /><span>{message}</span><button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={17} /></button></div>}
      {loadingListing ? <div className="listings-empty">Loading PG details...</div> : (
      <form onSubmit={handleSubmit(onSubmit)} className="listing-form">
        <section className="form-section"><div className="form-section-heading"><div className="form-section-icon"><Building2 size={20} /></div><div><h2>Basic Information</h2><p>Introduce your property to prospective residents.</p></div></div>
          <div className="form-grid">
            <label className="field full-width">PG Property Name *<input {...register("title")} placeholder="e.g. Green Nest PG for Professionals" />{errors.title && <small className="field-error">{errors.title.message}</small>}</label>
            <label className="field">PG Category *<select {...register("gender")}><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="CO_LIVING">Co-living</option></select></label>
            <label className="field">Room Availability Type *<select {...register("roomType")}><option value="SHARED">Shared rooms</option><option value="SINGLE">Single rooms</option></select></label>
            <label className="field full-width">Property Description *<textarea {...register("description")} rows={4} placeholder="Describe the property, rules, facilities and nearby landmarks..." />{errors.description && <small className="field-error">{errors.description.message}</small>}</label>
          </div>
        </section>
        <section className="form-section"><div className="form-section-heading"><div className="form-section-icon"><MapPin size={20} /></div><div><h2>Location Details</h2><p>Help candidates find your property in Bengaluru.</p></div></div>
          <div className="form-grid">
            <label className="field full-width">Complete Address *<input {...register("address")} placeholder="Building, street, area and landmark" />{errors.address && <small className="field-error">{errors.address.message}</small>}</label>
            <label className="field">Locality *<input {...register("locality")} placeholder="e.g. Vijayanagar" />{errors.locality && <small className="field-error">{errors.locality.message}</small>}</label>
            <label className="field">City *<input {...register("city")} placeholder="Bengaluru" />{errors.city && <small className="field-error">{errors.city.message}</small>}</label>
          </div>
        </section>
        <section className="form-section"><div className="form-section-heading"><div className="form-section-icon"><IndianRupee size={20} /></div><div><h2>Rent and Availability</h2><p>Provide transparent pricing and current vacancies.</p></div></div>
          <div className="form-grid">
            <label className="field">Monthly Rent per Person (₹) *<input type="number" min="1" {...register("monthlyRent")} />{errors.monthlyRent && <small className="field-error">{errors.monthlyRent.message}</small>}</label>
            <label className="field">Security Deposit (₹) *<input type="number" min="0" {...register("deposit")} />{errors.deposit && <small className="field-error">{errors.deposit.message}</small>}</label>
            <label className="field">Total Beds *<input type="number" min="1" {...register("totalBeds")} />{errors.totalBeds && <small className="field-error">{errors.totalBeds.message}</small>}</label>
            <label className="field">Currently Available Beds *<input type="number" min="0" {...register("availableBeds")} />{errors.availableBeds && <small className="field-error">{errors.availableBeds.message}</small>}</label>
          </div>
          <div className="form-tip"><BedDouble size={18} /><span>Changing availability updates the saved bed records. Beds that are not marked Available cannot be removed when reducing the total.</span></div>
        </section>
        <section className="form-section"><div className="form-section-heading"><div className="form-section-icon"><CheckCircle2 size={20} /></div><div><h2>Amenities</h2><p>Select facilities available at your property.</p></div></div>
          <div className="amenities-grid">{amenities.map(amenity => <label className="amenity-option" key={amenity}><input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} /><span>{amenity}</span></label>)}</div>
          <p className="form-tip">Amenities are not saved to the database yet; persistent amenity storage needs backend support.</p>
        </section>
        <section className="form-section"><div className="form-section-heading"><div className="form-section-icon"><ImagePlus size={20} /></div><div><h2>Property Photos</h2><p>Choose photos of rooms, common areas and facilities.</p></div></div>
          <label className="photo-upload"><ImagePlus size={30} /><strong>Choose property photos</strong><span>JPG, PNG or WebP images</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { setPhotos(Array.from(event.target.files ?? [])); setMessage(""); }} /></label>
          {photos.length > 0 && <div className="selected-photos">{photos.map((photo, index) => <div className="selected-photo" key={`${photo.name}-${index}`}><ImagePlus size={16} /><span>{photo.name}</span><button type="button" onClick={() => setPhotos(current => current.filter((_, i) => i !== index))} aria-label={`Remove ${photo.name}`}><X size={16} /></button></div>)}</div>}
          <p className="form-tip">Photos are selected locally but are not uploaded until image-storage support is added.</p>
        </section>
        <div className="form-footer"><p>Review the details before submitting your PG.</p><div className="form-actions"><Link to="/listings" className="cancel-button">Cancel</Link><button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving PG..." : isEditMode ? "Update PG" : "Save PG"}<ChevronRight size={18} /></button></div></div>
      </form>)}
    </div>
  );
}
