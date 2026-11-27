
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Briefcase,
  Download,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  servicesApi,
} from "../../../services/dashboard/services.api.js";

import {
  staffApi,
} from "../../../services/dashboard/staff.api.js";

import {
  EmptyState,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  FormField,
  Modal,
  PageHeader,
  Panel,
} from "../../../components/dashboard/common/DashboardUI";

import {
  useDashboardToast,
} from "../../../components/dashboard/common/DashboardToastProvider";

import {
  getDashboardFormErrors,
} from "../../../components/dashboard/common/dashboardFormErrors";

import {
  downloadCsv,
  parseCsv,
} from "../../../utils/csv";

import "./Servicespage.css";

const serviceHeaders = [
  "Name",
  "Description",
  "Link",
  "Pricing Type",
  "Price",
  "Duration",
  "Status",
];

const newForm = () => ({
  name: "",
  description: "",
  link: "",
  pricing_type: "Flat",
  price: "",
  duration: "",
  visibility: "Visible",
  show_price: true,
  bookable: true,
  is_active: true,
  assigned_staff_ids: [],
  intake_fields: [],
});

function serviceRecords(response) {
  const data = response?.data || response;

  const records = Array.isArray(data)
    ? data
    : data?.items ||
      data?.results ||
      data?.services ||
      [];

  return Array.isArray(records) ? records : [];
}

function isActive(service) {
  return (
    service.is_active !== false &&
    service.active !== false &&
    String(
      service.status || ""
    ).toLowerCase() !== "inactive" &&
    String(
      service.visibility || ""
    ).toLowerCase() !== "hidden"
  );
}

function validateService(form, pricingOptions) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Service name is required.";
  } else if (form.name.trim().length > 120) {
    errors.name = "Use 120 characters or fewer.";
  }

  if (form.link.trim()) {
    try {
      const url = new URL(form.link.trim());

      if (
        !["http:", "https:"].includes(
          url.protocol
        )
      ) {
        errors.link =
          "Use a valid HTTP or HTTPS link.";
      }
    } catch {
      errors.link =
        "Enter a valid link starting with https://.";
    }
  }

  if (
    form.pricing_type === "Flat" &&
    form.price !== "" &&
    (!Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0)
  ) {
    errors.price =
      "Price must be zero or greater.";
  }

  if (
    form.pricing_type === "Options / packages"
  ) {
    const named = pricingOptions.filter(
      (option) => option.label.trim()
    );

    if (!named.length) {
      errors.pricing_options =
        "Add at least one named package.";
    } else if (
      named.some(
        (option) =>
          option.price === "" ||
          !Number.isFinite(
            Number(option.price)
          ) ||
          Number(option.price) < 0
      )
    ) {
      errors.pricing_options =
        "Every named package needs a valid price.";
    }
  }

  return errors;
}

export default function ServicesPage() {
  const toast = useDashboardToast();

  const [services, setServices] =
    useState([]);

  const [status, setStatus] =
    useState("All Status");

  const [isOpen, setIsOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [form, setForm] =
    useState(newForm);

  const [staffMembers, setStaffMembers] =
    useState([]);

  const [pricingOptions, setPricingOptions] =
    useState([
      {
        label: "",
        price: "",
      },
    ]);

  const [newIntakeField, setNewIntakeField] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [formError, setFormError] =
    useState("");

  const csvRef = useRef(null);

  /* -----------------------------------
     LOAD SERVICES
  ----------------------------------- */

  const loadServices = useCallback(
    async ({ notify = false } = {}) => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response =
          await servicesApi.request();

        setServices(
          serviceRecords(response)
        );

        if (notify) {
          toast.success(
            "Services refreshed",
            "Latest catalogue data loaded."
          );
        }
      } catch (error) {
        const message =
          error?.message ||
          "Unable to load services.";

        setLoadError(message);

        // Keep the last successfully loaded data.

        if (notify) {
          toast.error(
            "Services refresh failed",
            message
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // AI Brain approvals may change services without visiting this page first.
  // React to same-tab approvals; mounting this route also always re-fetches.
  useEffect(() => {
    const onBrainApproval = () => { void loadServices(); };
    window.addEventListener('bellbee:services-catalog-updated', onBrainApproval);
    return () => window.removeEventListener('bellbee:services-catalog-updated', onBrainApproval);
  }, [loadServices]);

  /* -----------------------------------
     LOAD ASSIGNED STAFF
  ----------------------------------- */

  useEffect(() => {
    if (
      !isOpen ||
      !staffApi.isConfigured()
    ) {
      return undefined;
    }

    let active = true;

    staffApi
      .request()
      .then((response) => {
        if (!active) return;

        const data =
          response?.data || response;

        setStaffMembers(
          Array.isArray(data)
            ? data
            : data?.staff ||
              data?.items ||
              data?.results ||
              []
        );
      })
      .catch((error) => {
        if (active) {
          toast.error(
            "Unable to load staff",
            error?.message ||
              "Please try again."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, toast]);

  /* -----------------------------------
     FILTER SERVICES
  ----------------------------------- */

  const visible = useMemo(
    () =>
      services.filter(
        (service) =>
          status === "All Status" ||
          (status === "Active"
            ? isActive(service)
            : !isActive(service))
      ),
    [services, status]
  );

  /* -----------------------------------
     UPDATE FORM INPUT
  ----------------------------------- */

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [key]: "",
    }));

    setFormError("");
  }

  function openForm() {
    setFieldErrors({});
    setFormError("");
    setIsOpen(true);
  }

  function changePackage(index, field, value) {
    setPricingOptions((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

    setFieldErrors((current) => ({
      ...current,
      pricing_options: "",
    }));

    setFormError("");
  }

  /* -----------------------------------
     SAVE SERVICE
     ORIGINAL AXIOS PAYLOAD PRESERVED
  ----------------------------------- */

  async function saveService(event) {
    event.preventDefault();

    if (isSaving) return;

    setFieldErrors({});
    setFormError("");

    const errors = validateService(
      form,
      pricingOptions
    );

    if (Object.keys(errors).length) {
      setFieldErrors(errors);

      toast.warning(
        "Review service details",
        "Please correct the highlighted fields."
      );

      return;
    }

    setIsSaving(true);

    const pending = toast.loading(
      "Saving service",
      "Sending your details to Bellbee…"
    );

    try {
      await servicesApi.request({
        method: "POST",

        body: {
          name: form.name.trim(),

          description:
            form.description.trim(),

          link:
            form.link.trim() || null,

          pricing_type: form.pricing_type
            .toLowerCase()
            .replaceAll(" ", "_")
            .replace("/", "_"),

          price:
            form.price === ""
              ? null
              : Number(form.price),

          duration:
            form.duration.trim() || null,

          visibility:
            form.visibility.toLowerCase(),

          is_active:
            form.is_active,

          show_price:
            form.show_price,

          is_bookable:
            form.bookable,

          assigned_staff_ids:
            form.assigned_staff_ids,

          intake_fields:
            form.intake_fields,

          ...(form.pricing_type ===
          "Options / packages"
            ? {
                pricing_options:
                  pricingOptions
                    .filter((item) =>
                      item.label.trim()
                    )
                    .map((item) => ({
                      name: item.label.trim(),

                      price: Number(
                        item.price
                      ),
                    })),
              }
            : {}),
        },
      });

      toast.update(
        pending,
        "success",
        "Service saved successfully",
        "Backend accepted your changes."
      );

      setForm(newForm());

      setPricingOptions([
        {
          label: "",
          price: "",
        },
      ]);

      setNewIntakeField("");

      setIsOpen(false);

      await loadServices();
    } catch (error) {
      const parsed =
        getDashboardFormErrors(error, {
          is_bookable: "bookable",
          pricing_options:
            "pricing_options",
        });

      setFieldErrors(parsed.fields);
      setFormError(parsed.summary);

      toast.update(
        pending,
        "error",
        "Service was not saved",
        "Review the error message inside the form."
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* -----------------------------------
     EXPORT CSV
  ----------------------------------- */

  function exportServices() {
    downloadCsv(
      "bellbee-services.csv",
      serviceHeaders,

      visible.map((item) => [
        item.name,
        item.description,
        item.link,

        item.pricing_type ||
          item.pricing,

        item.price ?? "",
        item.duration || "",

        item.visibility ||
          item.status ||
          "",
      ])
    );

    toast.info(
      "CSV export prepared",
      "The visible services were exported."
    );
  }

  /* -----------------------------------
     IMPORT CSV
  ----------------------------------- */

  async function importCsv(event) {
    const file =
      event.target.files?.[0];

    if (!file || isImporting) {
      return;
    }

    setIsImporting(true);

    const pending = toast.loading(
      "Importing services",
      "Checking and uploading your CSV…"
    );

    try {
      const records = parseCsv(
        await file.text()
      );

      const imported = records
        .map((record) => ({
          name:
            record.name ||
            record["service name"] ||
            "",

          description:
            record.description || "",

          link:
            record.link || "",

          pricing_type:
            record["pricing type"] ||
            "Flat",

          price:
            record.price || null,

          duration:
            record.duration || "",

          visibility:
            record.status || "Visible",
        }))
        .filter(
          (service) => service.name
        );

      if (!imported.length) {
        throw new Error(
          "No services found. Check for a Name or Service Name column."
        );
      }

      await servicesApi.request({
        method: "POST",
        action: "import",

        body: {
          services: imported,
        },
      });

      toast.update(
        pending,
        "success",
        "Services imported",
        `${
          imported.length
        } service${
          imported.length === 1
            ? ""
            : "s"
        } accepted.`
      );

      await loadServices();
    } catch (error) {
      toast.update(
        pending,
        "error",
        "Import failed",
        error?.message ||
          "Please check your CSV file."
      );
    } finally {
      setIsImporting(false);

      event.target.value = "";
    }
  }

  /* -----------------------------------
     PAGE
  ----------------------------------- */

  return (
    <main className="bb-services-premium">
      <PageHeader
        eyebrow="YOUR BUSINESS CATALOGUE"
        title="Services"
        description="Manage the services your AI assistant lets customers discover and book."
        actions={
          <>
            <button
              type="button"
              className="dp-secondary-button"
              onClick={() =>
                loadServices({
                  notify: true,
                })
              }
              disabled={isLoading}
            >
              <RefreshCw size={15} />

              {isLoading
                ? "Loading…"
                : "Refresh"}
            </button>

            <button
              type="button"
              className="dp-secondary-button"
              onClick={() =>
                csvRef.current?.click()
              }
              disabled={isImporting}
            >
              <Upload size={15} />

              {isImporting
                ? "Importing…"
                : "Import CSV"}
            </button>

            <button
              type="button"
              className="dp-secondary-button"
              onClick={exportServices}
              disabled={!visible.length}
            >
              <Download size={15} />

              Export CSV
            </button>

            <button
              type="button"
              className="dp-primary-button"
              onClick={openForm}
            >
              <Plus size={15} />

              Add service
            </button>
          </>
        }
      />

      <input
        ref={csvRef}
        type="file"
        accept=".csv,text/csv"
        className="dp-visually-hidden"
        onChange={importCsv}
      />

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error bb-services-error"
          role="alert"
        >
          {loadError}
        </div>
      )}

      <Panel className="bb-services-list-panel">
        <div className="bb-services-heading">
          <div>
            <span>
              YOUR SERVICES
            </span>

            <h2>
              Service catalogue
            </h2>
          </div>

          <span className="bb-services-count">
            {isLoading
              ? "Loading…"
              : `${
                  visible.length
                } displayed`}
          </span>
        </div>

        <div className="dp-toolbar dp-toolbar-between">
          <select
            aria-label="Filter services by status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option>
              All Status
            </option>

            <option>
              Active
            </option>

            <option>
              Inactive
            </option>
          </select>
        </div>

        {isLoading ? (
          <div
            className="dp-api-empty-state"
            role="status"
          >
            Loading services…
          </div>
        ) : loadError &&
          !services.length ? (
          <div className="dp-api-empty-state">
            <Briefcase size={24} />

            <strong>
              Unable to load services
            </strong>

            <p>
              Check your connection and use Refresh.
            </p>
          </div>
        ) : visible.length ? (
          <div className="bb-services-table-scroll">
            <div className="dp-data-list">
              <div className="dp-data-list-heading">
                <span>Service</span>
                <span>Pricing</span>
                <span>Duration</span>
                <span>Visibility</span>
              </div>

              {visible.map(
                (item, index) => (
                  <div
                    className="dp-data-list-row"
                    key={
                      item.id ||
                      item.service_id ||
                      index
                    }
                  >
                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.description ||
                          "No description added"}
                      </small>
                    </div>

                    <span>
                      {item.price != null
                        ? `PKR ${Number(
                            item.price
                          ).toLocaleString()}`
                        : "On request"}
                    </span>

                    <span>
                      {item.duration ||
                        "Not set"}
                    </span>

                    <span
                      className={`dp-status-pill ${
                        isActive(item)
                          ? "success"
                          : "neutral"
                      }`}
                    >
                      {isActive(item)
                        ? "Visible"
                        : "Hidden"}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title={
              services.length
                ? "No matching services"
                : "No services yet"
            }
            description={
              services.length
                ? "Change the status filter to see more results."
                : "Add your first service so customers can discover and book it in chat."
            }
            buttonText="Add service"
            onAction={openForm}
          />
        )}
      </Panel>

      <p className="dp-form-note bb-services-footnote">
        Assigned staff and opening hours
        are managed under AI Brain →
        Hours & Staff.
      </p>

      {isOpen && (
        <Modal
          title="Add service"
          description="Set the details your AI uses for customer enquiries and bookings."
          error={formError}
          onClose={() => {
            if (!isSaving) {
              setIsOpen(false);
            }
          }}
          footer={
            <>
              <button
                type="button"
                className="dp-secondary-button"
                disabled={isSaving}
                onClick={() =>
                  setIsOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                form="service-form"
                className="dp-primary-button"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving…"
                  : "Save service"}

                <Plus size={14} />
              </button>
            </>
          }
        >
          <form
            id="service-form"
            className="dp-form-grid bb-service-form"
            onSubmit={saveService}
            noValidate
          >
            <FormField
              label="Service name"
              error={fieldErrors.name}
            >
              <FieldInput
                value={form.name}
                required
                maxLength={120}
                aria-invalid={Boolean(
                  fieldErrors.name
                )}
                onChange={(event) =>
                  update(
                    "name",
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField
              label="Pricing type"
              error={fieldErrors.pricing_type}
            >
              <FieldSelect
                value={form.pricing_type}
                onChange={(event) =>
                  update(
                    "pricing_type",
                    event.target.value
                  )
                }
              >
                <option>
                  Flat
                </option>

                <option>
                  Options / packages
                </option>

                <option>
                  On request
                </option>
              </FieldSelect>
            </FormField>

            <FormField
              label="Description"
              className="dp-form-full"
              error={fieldErrors.description}
            >
              <FieldTextarea
                rows={3}
                maxLength={500}
                value={form.description}
                placeholder="Describe this service..."
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value
                  )
                }
              />

              <small>
                {form.description.length}
                /500 characters
              </small>
            </FormField>

            {form.pricing_type === "Flat" && (
              <FormField
                label="Price (PKR)"
                error={fieldErrors.price}
              >
                <FieldInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  aria-invalid={Boolean(
                    fieldErrors.price
                  )}
                  onChange={(event) =>
                    update(
                      "price",
                      event.target.value
                    )
                  }
                />
              </FormField>
            )}

            {form.pricing_type ===
              "Options / packages" && (
              <div className="dp-form-full dp-service-options">
                <strong>
                  Pricing options / packages
                </strong>

                {pricingOptions.map(
                  (option, index) => (
                    <div
                      className="dp-service-option-row"
                      key={index}
                    >
                      <FieldInput
                        aria-label={`Package ${
                          index + 1
                        } name`}
                        placeholder="Package name"
                        value={option.label}
                        onChange={(event) =>
                          changePackage(
                            index,
                            "label",
                            event.target.value
                          )
                        }
                      />

                      <FieldInput
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Package ${
                          index + 1
                        } price`}
                        placeholder="Price (PKR)"
                        value={option.price}
                        onChange={(event) =>
                          changePackage(
                            index,
                            "price",
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="dp-text-button"
                        onClick={() =>
                          setPricingOptions(
                            (items) =>
                              items.filter(
                                (_, i) =>
                                  i !== index
                              )
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                {fieldErrors.pricing_options && (
                  <small
                    className="dp-field-error"
                    role="alert"
                  >
                    {fieldErrors.pricing_options}
                  </small>
                )}

                <button
                  type="button"
                  className="dp-secondary-button"
                  onClick={() =>
                    setPricingOptions(
                      (items) => [
                        ...items,
                        {
                          label: "",
                          price: "",
                        },
                      ]
                    )
                  }
                >
                  <Plus size={14} />

                  Add option
                </button>
              </div>
            )}

            <FormField
              label="Duration"
              hint="Optional"
              error={fieldErrors.duration}
            >
              <FieldInput
                placeholder="e.g. 60 minutes"
                value={form.duration}
                onChange={(event) =>
                  update(
                    "duration",
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField
              label="Booking / service link"
              error={fieldErrors.link}
            >
              <FieldInput
                type="url"
                placeholder="https://"
                value={form.link}
                aria-invalid={Boolean(
                  fieldErrors.link
                )}
                onChange={(event) =>
                  update(
                    "link",
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField
              label="Visibility"
              error={fieldErrors.visibility}
            >
              <FieldSelect
                value={form.visibility}
                onChange={(event) =>
                  update(
                    "visibility",
                    event.target.value
                  )
                }
              >
                <option>
                  Visible
                </option>

                <option>
                  Hidden
                </option>
              </FieldSelect>
            </FormField>

            <div className="dp-service-toggles dp-form-full">
              <label>
                <input
                  type="checkbox"
                  checked={form.show_price}
                  onChange={(event) =>
                    update(
                      "show_price",
                      event.target.checked
                    )
                  }
                />

                <span>
                  Show price on booking page
                </span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    update(
                      "is_active",
                      event.target.checked
                    )
                  }
                />

                <span>
                  Active for public booking
                </span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.bookable}
                  onChange={(event) =>
                    update(
                      "bookable",
                      event.target.checked
                    )
                  }
                />

                <span>
                  Customers can book this as an appointment
                </span>
              </label>

              {fieldErrors.bookable && (
                <small
                  className="dp-field-error"
                  role="alert"
                >
                  {fieldErrors.bookable}
                </small>
              )}

              {fieldErrors.is_active && (
                <small
                  className="dp-field-error"
                  role="alert"
                >
                  {fieldErrors.is_active}
                </small>
              )}

              {fieldErrors.show_price && (
                <small
                  className="dp-field-error"
                  role="alert"
                >
                  {fieldErrors.show_price}
                </small>
              )}
            </div>

            <div className="dp-service-staff dp-form-full">
              <strong>
                Assigned staff
              </strong>

              {staffMembers.length ? (
                staffMembers.map((staff) => {
                  const id = String(
                    staff.id ||
                      staff.staff_id
                  );

                  return (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={form.assigned_staff_ids.includes(
                          id
                        )}
                        onChange={(event) =>
                          update(
                            "assigned_staff_ids",
                            event.target.checked
                              ? [
                                  ...form.assigned_staff_ids,
                                  id,
                                ]
                              : form.assigned_staff_ids.filter(
                                  (value) =>
                                    value !== id
                                )
                          )
                        }
                      />

                      <span>
                        {staff.name ||
                          staff.full_name}
                      </span>
                    </label>
                  );
                })
              ) : (
                <small>
                  Staff will appear when
                  the AI Brain staff API
                  returns records.
                </small>
              )}

              {fieldErrors.assigned_staff_ids && (
                <small
                  className="dp-field-error"
                  role="alert"
                >
                  {fieldErrors.assigned_staff_ids}
                </small>
              )}
            </div>

            <div className="dp-service-intake dp-form-full">
              <strong>
                Customer intake fields
              </strong>

              <div>
                <FieldInput
                  value={newIntakeField}
                  placeholder="e.g. Preferred appointment date"
                  onChange={(event) =>
                    setNewIntakeField(
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="dp-secondary-button"
                  onClick={() => {
                    if (!newIntakeField.trim()) {
                      return;
                    }

                    update(
                      "intake_fields",
                      [
                        ...form.intake_fields,
                        newIntakeField.trim(),
                      ]
                    );

                    setNewIntakeField("");
                  }}
                >
                  <Plus size={14} />

                  Add field
                </button>
              </div>

              {form.intake_fields.map(
                (field, index) => (
                  <p
                    key={`${field}-${index}`}
                  >
                    {field}

                    <button
                      type="button"
                      className="dp-text-button"
                      onClick={() =>
                        update(
                          "intake_fields",
                          form.intake_fields.filter(
                            (_, i) =>
                              i !== index
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </p>
                )
              )}

              {fieldErrors.intake_fields && (
                <small
                  className="dp-field-error"
                  role="alert"
                >
                  {fieldErrors.intake_fields}
                </small>
              )}
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
