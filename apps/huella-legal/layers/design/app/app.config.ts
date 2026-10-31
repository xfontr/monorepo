import accordion from "./theme/accordion";
import alert from "./theme/alert";
import avatar from "./theme/avatar";
import breadcrumb from "./theme/breadcrumb";
import button from "./theme/button";
import checkbox from "./theme/checkbox";
import commandPalette from "./theme/commandPalette";
import container from "./theme/container";
import empty from "./theme/empty";
import fileUpload from "./theme/fileUpload";
import footer from "./theme/footer";
import footerColumns from "./theme/footerColumns";
import header from "./theme/header";
import input from "./theme/input";
import modal from "./theme/modal";
import navigationMenu from "./theme/navigationMenu";
import pageCard from "./theme/pageCard";
import pageFeature from "./theme/pageFeature";
import pageSection from "./theme/pageSection";
import pagination from "./theme/pagination";
import select from "./theme/select";
import skeleton from "./theme/skeleton";
import textarea from "./theme/textarea";
import tv from "./theme/tv";

export default defineAppConfig({
    ui: {
        tv,

        colors: {
            primary: "huella-slate",
            secondary: "huella-teal",
            neutral: "huella-ink",
            error: "huella-danger",
        },

        button,
        container,
        header,
        navigationMenu,
        footer,
        footerColumns,
        avatar,
        input,
        checkbox,
        fileUpload,
        breadcrumb,
        pagination,
        empty,
        pageCard,
        pageFeature,
        pageSection,
        skeleton,
        select,
        textarea,
        alert,
        accordion,
        modal,
        commandPalette,
    },
});
